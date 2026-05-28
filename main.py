import os
import json
import contextlib
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CX = os.getenv("GOOGLE_CX")

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def init_db():
    """Cria a tabela no PostgreSQL se ela não existir."""
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS maquinas (
                    id SERIAL PRIMARY KEY,
                    modelo TEXT UNIQUE NOT NULL,
                    imageUrl TEXT,
                    intervaloHoras INTEGER,
                    intervaloMeses INTEGER,
                    pontosOleo TEXT,
                    tipoOleo TEXT,
                    observacoes TEXT
                )
            ''')
        conn.commit()

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="API Cuidados de Costura", lifespan=lifespan)

class MachineInfo(BaseModel):
    modelo: str
    imageUrl: Optional[str] = None
    intervaloHoras: int
    intervaloMeses: int
    pontosOleo: List[str]
    tipoOleo: str
    observacoes: str

@app.get("/")
def root(): return {"mensagem": "API Cuidados de Costura está Online no Render!", "docs": "/docs"}

def buscar_imagem_google(modelo_maquina: str) -> Optional[str]:
    query = f"Máquina de costura industrial {modelo_maquina}"
    url = "https://www.googleapis.com/customsearch/v1"
    
    params = {
        "key": GOOGLE_API_KEY,
        "cx": GOOGLE_CX,
        "q": query,
        "searchType": "image",
        "num": 1,
        "imgSize": "medium"
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if "items" in data and len(data["items"]) > 0:
            return data["items"][0]["link"]
        return None
    except Exception as e:
        print(f"Erro ao buscar imagem no Google: {e}")
        return None

@app.get("/api/maquinas/busca", response_model=MachineInfo)
def buscar_maquina(q: str):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM maquinas WHERE modelo ILIKE %s LIMIT 1", (f"%{q}%",))
            row = cursor.fetchone()
            
            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, 
                    detail="Máquina não encontrada no banco de dados."
                )
            
            imageUrl = row["imageurl"]
            
            if not imageUrl or not str(imageUrl).startswith("http"):
                nova_imagem = buscar_imagem_google(row["modelo"])
                
                if nova_imagem:
                    imageUrl = nova_imagem
                    cursor.execute("UPDATE maquinas SET imageUrl = %s WHERE id = %s", (nova_imagem, row["id"]))
                    conn.commit()

            pontos_oleo_list = json.loads(row["pontosoleo"]) if row["pontosoleo"] else []
            
            return MachineInfo(
                modelo=row["modelo"],
                imageUrl=imageUrl,
                intervaloHoras=row["intervalohoras"] or 0,
                intervaloMeses=row["intervalomeses"] or 0,
                pontosOleo=pontos_oleo_list,
                tipoOleo=row["tipooleo"] or "",
                observacoes=row["observacoes"] or ""
            )

@app.post("/api/maquinas", status_code=status.HTTP_201_CREATED)
def adicionar_maquina(maquina: MachineInfo):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            pontos_oleo_json = json.dumps(maquina.pontosOleo)
            
            try:
                cursor.execute('''
                    INSERT INTO maquinas (
                        modelo, imageUrl, intervaloHoras, intervaloMeses, 
                        pontosOleo, tipoOleo, observacoes
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                ''', (
                    maquina.modelo, maquina.imageUrl, maquina.intervaloHoras, 
                    maquina.intervaloMeses, pontos_oleo_json, maquina.tipoOleo, 
                    maquina.observacoes
                ))
                conn.commit()
                return {"mensagem": f"Máquina {maquina.modelo} adicionada com sucesso!"}
            except psycopg2.IntegrityError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Este modelo de máquina já existe no banco de dados."
                )