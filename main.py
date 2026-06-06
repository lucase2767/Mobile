import os
import json
import contextlib
import requests
from serpapi import GoogleSearch
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SERPAPI_KEY = os.getenv("SERPAPI_KEY")

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def init_db():
    """Cria a tabela no PostgreSQL se ela não existir."""
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute('CREATE EXTENSION IF NOT EXISTS unaccent;')
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

def buscar_imagem_serpapi(modelo_maquina: str) -> Optional[str]:
    try:
        params = {
            "engine": "google_images",
            "q": f"Máquina de costura industrial {modelo_maquina}",
            "hl": "pt",
            "gl": "br",
            "ijn": "0",
            "api_key": SERPAPI_KEY
        }
        search = GoogleSearch(params)
        results = search.get_dict()
        images = results.get("images_results", [])

        if images:
            return images[0]["original"]
        return None
    except Exception as e:
        print(f"Erro ao buscar imagem no SerpApi: {e}")
        return None

@app.get("/api/maquinas/busca", response_model=List[MachineInfo])
def buscar_maquina(q: str):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM maquinas WHERE unaccent(modelo) ILIKE unaccent(%s) LIMIT 10",
                (f"%{q}%",)
            )
            rows = cursor.fetchall()

            if not rows:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Máquina não encontrada no banco de dados."
                )

            resultado = []
            for row in rows:
                imageUrl = row["imageurl"]

                if not imageUrl or not str(imageUrl).startswith("http"):
                    nova_imagem = buscar_imagem_serpapi(row["modelo"])

                    if nova_imagem:
                        imageUrl = nova_imagem
                        cursor.execute(
                            "UPDATE maquinas SET imageUrl = %s WHERE id = %s",
                            (nova_imagem, row["id"])
                        )
                        conn.commit()

                pontos_oleo_list = json.loads(row["pontosoleo"]) if row["pontosoleo"] else []

                resultado.append(MachineInfo(
                    modelo=row["modelo"],
                    imageUrl=imageUrl,
                    intervaloHoras=row["intervalohoras"] or 0,
                    intervaloMeses=row["intervalomeses"] or 0,
                    pontosOleo=pontos_oleo_list,
                    tipoOleo=row["tipooleo"] or "",
                    observacoes=row["observacoes"] or ""
                ))

            return resultado

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