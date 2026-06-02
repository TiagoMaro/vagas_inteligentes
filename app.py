import os
from flask import Flask, render_template, request, jsonify
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Carrega a chave do arquivo .env com segurança
load_dotenv()

app = Flask(__name__)

API_URL = "https://jsearch.p.rapidapi.com/search"
API_KEY = os.getenv("RAPIDAPI_KEY")

@app.route('/')
def index():
    # Renderiza o arquivo HTML que está dentro da pasta templates
    return render_template('index.html')

MODO_TESTE = True  # Mude para False quando for fazer a apresentação real!

@app.route('/buscar', methods=['GET'])
def buscar_vagas():
    # Captura os dados enviados pelo JavaScript (tanto da barra principal quanto do modal)
    termo_busca = request.args.get('q', '').strip().lower()
    localizacao = request.args.get('local', '').strip().lower()
    tipo_emprego = request.args.get('employment_types', '')
    modelo = request.args.get('modelo', '')
    data_publicacao = request.args.get('data_post', 'all')
    empresa = request.args.get('empresa', '').strip().lower()

    # ================= MODO DE TESTE INTELIGENTE (MOCK) =================
    if MODO_TESTE:
        print("⚠️ Alerta: Filtrando dados simulados na memória - Nenhuma requisição gasta!")
        
        # Base de dados fixa idêntica ao seu mockup do Figma, mas com datas dinâmicas para o teste funcionar
        hoje = datetime.utcnow()
        vagas_falsas = [
            {
                "job_title": "Estágio em Engenharia de Software",
                "employer_name": "Pengu Net",
                "job_city": "Curitiba",
                "job_publisher": "Indeed",
                "job_employment_type": "Meio Período",
                "job_description": "Procuramos um profissional dinâmico e proativo para integrar a nossa equipe de infraestrutura. Na Pengu Net, você será responsável por garantir a estabilidade da nossa rede local e auxiliar no suporte técnico aos nossos assinantes...\n\nRequisitos:\n• Ensino Técnico em Andamento ou Concluído, Redes de Computadores, Informática ou áreas correlatas.",
                "job_apply_link": "https://example.com/vaga1",
                "job_posted_at_datetime_utc": hoje.isoformat()  # Publicada AGORA (hoje)
            },
            {
                "job_title": "Analista de People Experience",
                "employer_name": "Elims Bem-Estar Corporativo",
                "job_city": "Pinhais",
                "job_publisher": "LinkedIn",
                "job_employment_type": "Tempo Integral",
                "job_description": "Buscamos um profissional empático e comunicativo para atuar diretamente na gestão de programas de saúde mental, ergonomia e clima organizacional para os nossos clientes corporativos.",
                "job_apply_link": "https://example.com/vaga2",
                "job_posted_at_datetime_utc": (hoje - timedelta(days=5)).isoformat()  # Publicada há 5 dias (esta semana)
            },
            {
                "job_title": "Técnico em Acústica e Sonorização",
                "employer_name": "Sound MINX",
                "job_city": "Pinhais",
                "job_publisher": "Glassdoor",
                "job_employment_type": "Tempo Integral",
                "job_description": "Estamos em busca de um Técnico ou Projetista em Acústica para integrar nosso time de engenharia e design. Você atuará no desenvolvimento de soluções de isolamento sonoro.",
                "job_apply_link": "https://example.com/vaga3",
                "job_posted_at_datetime_utc": (hoje - timedelta(days=20)).isoformat()  # Publicada há 20 dias (este mês)
            }
        ]

        # 1. Filtro por Cargo (Barra Principal)
        if termo_busca:
            vagas_falsas = [v for v in vagas_falsas if termo_busca in v["job_title"].lower()]

        # 2. Filtro por Localização (Barra Principal)
        if localizacao and localizacao != "brasil":
            vagas_falsas = [v for v in vagas_falsas if localizacao in v["job_city"].lower()]

        # 3. Filtro por Empresa (Modal)
        if empresa:
            vagas_falsas = [v for v in vagas_falsas if empresa in v["employer_name"].lower()]

        # 4. Filtro por Tipo de Emprego (Modal)
        if tipo_emprego:
            vagas_falsas = [v for v in vagas_falsas if tipo_emprego.lower() in v["job_employment_type"].lower()]

        # 5. Filtro por Data de Publicação (Modal)
        if data_publicacao != "all":
            vagas_filtradas_por_data = []
            for vaga in vagas_falsas:
                data_vaga = datetime.fromisoformat(vaga["job_posted_at_datetime_utc"].replace("Z", ""))
                diferenca_dias = (hoje - data_vaga).days
                
                if data_publicacao == "today" and diferenca_dias <= 1:
                    vagas_filtradas_por_data.append(vaga)
                elif data_publicacao == "3days" and diferenca_dias <= 3:
                    vagas_filtradas_por_data.append(vaga)
                elif data_publicacao == "week" and diferenca_dias <= 7:
                    vagas_filtradas_por_data.append(vaga)
                elif data_publicacao == "month" and diferenca_dias <= 30:
                    vagas_filtradas_por_data.append(vaga)
            vagas_falsas = vagas_filtradas_por_data

        return jsonify(vagas_falsas)

    # ================= CÓDIGO REAL DA API (Só roda se MODO_TESTE = False) =================
    termo_busca = request.args.get('q', 'Desenvolvedor')
    localizacao = request.args.get('local', '')
    tipo_emprego = request.args.get('employment_types', '')
    modelo = request.args.get('modelo', '')
    data_publicacao = request.args.get('data_post', 'all')
    empresa = request.args.get('empresa', '')

    query_partes = [termo_busca]
    if empresa: query_partes.append(f"na {empresa}")
    if localizacao: query_partes.append(f"em {localizacao}")
    query_final = " ".join(query_partes)

    querystring = {"query": query_final, "page": "1", "num_pages": "10", "date_posted": data_publicacao}
    if tipo_emprego: querystring["employment_types"] = tipo_emprego
    if modelo == "remoto": querystring["remote_jobs_only"] = "true"

    headers = {"X-RapidAPI-Key": API_KEY, "X-RapidAPI-Host": "jsearch.p.rapidapi.com"}
    
    try:
        response = requests.get(API_URL, headers=headers, params=querystring)
        dados = response.json()
        return jsonify(dados.get('data', []))
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    # Roda o servidor em modo de desenvolvimento/debug
    app.run(debug=True)
