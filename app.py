from flask import Flask, request, jsonify, render_template
from flask_wtf.csrf import CSRFProtect
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os
import logging
import re
from functools import wraps

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Limit requests to 16MB
csrf = CSRFProtect(app)
CORS(app)

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def validate_email(email):
    return re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email)

def validate_phone(phone):
    # Remove non-digit characters and validate length (10-11 digits for BR phones)
    digits = re.sub(r'\D', '', phone)
    return 10 <= len(digits) <= 11

def limit_content_length(max_length):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if request.content_length > max_length:
                return jsonify({"status": "error", "message": "Payload too large"}), 413
            return f(*args, **kwargs)
        return wrapper
    return decorator

def send_email(subject, body, to_email):
    try:
        msg = MIMEMultipart()
        msg['Subject'] = subject
        msg['From'] = os.getenv('EMAIL_USER')
        msg['To'] = to_email
        
        msg.attach(MIMEText(body, 'html'))
        
        with smtplib.SMTP(os.getenv('SMTP_SERVER'), int(os.getenv('SMTP_PORT')), timeout=10) as server:
            server.starttls()
            server.login(os.getenv('EMAIL_USER'), os.getenv('EMAIL_PASS'))
            server.send_message(msg)
    except Exception as e:
        logger.error(f"Erro ao enviar email: {str(e)}")
        raise

@app.route('/submit_quote', methods=['POST'])
@csrf.exempt
@limit_content_length(1024 * 10)  # 10KB max
def submit_quote():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "Nenhum dado recebido"}), 400

        required_fields = ['name', 'email', 'phone', 'details']
        if not all(field in data for field in required_fields):
            return jsonify({"status": "error", "message": "Campos obrigatórios faltando"}), 400

        # Validação de email
        if not validate_email(data['email']):
            return jsonify({"status": "error", "message": "Email inválido"}), 400

        # Validação de telefone
        if not validate_phone(data['phone']):
            return jsonify({"status": "error", "message": "Telefone inválido"}), 400

        # Limitar tamanho dos campos
        if len(data['details']) > 500:
            return jsonify({"status": "error", "message": "Detalhes muito longos (máx 500 caracteres)"}), 400

        # Corpo do email formatado
        email_body = f"""
        <h2>Nova solicitação de orçamento</h2>
        <p><strong>Nome:</strong> {data['name'][:100]}</p>
        <p><strong>Email:</strong> {data['email'][:100]}</p>
        <p><strong>Telefone:</strong> {data['phone'][:20]}</p>
        <p><strong>Detalhes:</strong> {data['details'][:500]}</p>
        """
        
        send_email("Novo Orçamento - Sirleia Bordados", email_body, "contato@sirleiabordados.com.br")
        
        logger.info(f"Orçamento recebido de: {data['email']}")
        return jsonify({
            "status": "success",
            "message": "Sua solicitação foi recebida com sucesso! Entraremos em contato em breve."
        }), 200
        
    except smtplib.SMTPException as e:
        logger.error(f"Erro ao enviar email: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Erro ao enviar sua mensagem. Por favor, tente novamente mais tarde."
        }), 500
    except Exception as e:
        logger.error(f"Erro inesperado: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Ocorreu um erro inesperado. Por favor, tente novamente."
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
    from flask_wtf.csrf import validate_csrf
from wtforms import ValidationError

@app.route('/submit_quote', methods=['POST'])
def submit_quote():
    try:
        validate_csrf(request.headers.get('X-CSRF-Token'))
        # resto do código...
    except ValidationError:
        return jsonify({"status": "error", "message": "Token CSRF inválido"}), 400
    except Exception as e:
        logger.error(f"Erro inesperado: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Ocorreu um erro inesperado. Por favor, tente novamente."
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
    app.run(host='0.0.0.0', port=5000)  # Para produção, use um servidor WSGI como Gunicorn ou uWSGI

    