import os
import uuid

from flask import Flask, render_template, request, jsonify, redirect, url_for
from pymongo import MongoClient
from twilio.base.exceptions import TwilioException
from twilio.rest import Client
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# Twilio credentials
account_sid = "ACe0427f4c5c09aae9ba7ddae0b1075c5f"
auth_token = "d3eb7227fd1ad1a44262ffa3adfa922e"
verify_sid = "VA10e940625b3d16dcbb194c62000332c9"

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['donor_beneficiary']
donor_collection = db['donors']
beneficiary_collection = db['beneficiaries']
login_collection = db['login']

# Twilio client
client = Client(account_sid, auth_token)


@app.route('/')
def index():
    return render_template('login.html')


@app.route('/donor_profile')
def donor_profile():
    return render_template('UserHome.html')


@app.route('/beneficiary_profile')
def beneficiary_profile():
    return render_template('BeneficiaryHome.html')


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    phone = data.get('phone')
    user_type = data.get('user_type')
    password = data.get('password')


    user = login_collection.find_one({'phone': phone})
    if check_phone_number(phone) and check_password_hash(user['password'], password):
        if user_type == 'donor':
            return render_template('UserHome.html')
        elif user_type == 'beneficiary':
            return render_template('BeneficiaryHome.html')
    else:
        # Login failed
        return jsonify({'message': 'Invalid login credentials'}), 401


def check_phone_number(phone):
    user = login_collection.find_one({'phone': phone})
    return user is not None


@app.route('/check_phone', methods=['POST'])
def check_phone():
    data = request.json
    phone = data.get('phone')
    exists = check_phone_number(phone)
    print("Checking...")
    return jsonify({'success': exists})


@app.route("/change_password", methods=["POST"])
def change_password():
    data = request.json
    phone = data.get('phone')
    user_type = data.get('user_type')
    password = data.get('password')

    if user_type == 'donor':
        collection = donor_collection
    elif user_type == 'beneficiary':
        collection = beneficiary_collection

    print("Updating password...")
    exists = check_phone_number(phone)
    if exists:
        collection.update_one(
            {"phone": phone},
            {"$set": {"password": generate_password_hash(password)}}
        )

        login_collection.update_one(
            {"phone": phone},
            {"user_type": user_type},
            {"$set": {"password": generate_password_hash(password)}}
        )
        return jsonify({'success': exists})
    else:
        return jsonify({'success': exists})


@app.route('/signup/donor', methods=['POST'])
def signup_donor():
    name = request.form['name']
    phone = request.form['phone']
    email = request.form['email']
    password = request.form['password']

    exists = check_phone_number(phone)
    if exists:
        return jsonify({'success': exists})

    if 'aadhar' in request.files:
        aadhar_file = request.files['aadhar']
        unique_filename = str(uuid.uuid4()) + os.path.splitext(aadhar_file.filename)[-1]
        file_path = os.path.join('templates/donor_aadhar', unique_filename)
        aadhar_file.save(file_path)
    else:
        # Handle case where Aadhar file is not provided
        return jsonify({'error': 'Aadhar file is required'}), 400

    hashed_password = generate_password_hash(password)
    user_data = {
        'name': name,
        'phone': phone,
        'email': email,
        'password': hashed_password,
        'aadhar_file_path': file_path
    }
    donor_collection.insert_one(user_data)

    login_collection.insert_one({'phone': phone, 'user_type': 'donor', 'password': hashed_password})

    return jsonify({'message': 'Data received successfully'}), 200


@app.route('/signup/beneficiary', methods=['POST'])
def signup_beneficiary():
    name = request.form['name']
    phone = request.form['phone']
    email = request.form['email']
    address = request.form['address']
    password = request.form['password']

    exists = check_phone_number(phone)
    if exists:
        return jsonify({'success': exists})

    if 'certificate' in request.files:
        aadhar_file = request.files['certificate']
        unique_filename = str(uuid.uuid4()) + os.path.splitext(aadhar_file.filename)[-1]
        file_path = os.path.join('templates/beneficiary_cert', unique_filename)
        aadhar_file.save(file_path)
    else:
        # Handle case where Aadhar file is not provided
        return jsonify({'error': 'Aadhar file is required'}), 400
    hashed_password = generate_password_hash(password)
    user_data = {
        'name': name,
        'phone': phone,
        'email': email,
        'address': address,
        'password': hashed_password,
        'cert_file_path': file_path
    }
    beneficiary_collection.insert_one(user_data)
    login_collection.insert_one({'phone': phone, 'user_type': 'beneficiary', 'password': hashed_password})

    return jsonify({'message': 'Data received successfully'}), 200


@app.route('/resend_otp', methods=['POST'])
def resend_otp():
    if request.method == 'POST':
        phone = request.json.get('phone')

        status = send_verification_code(phone)
        __import__('time').sleep(10)
        if status == 'failed':
            return jsonify({'message': 'Failed to send OTP'})
        else:
            return jsonify({'message': 'OTP sent successfully'})


def send_verification_code(phone):
    try:
        verification = client.verify.v2.services(verify_sid) \
            .verifications \
            .create(to=f"+91{phone}", channel="sms")
        print("OTP on-process")
        return verification.status
    except TwilioException as e:
        print(f"An error occurred: {e}")
        print("Please check your phone number and try again.")


@app.route('/verify_otp', methods=['POST'])
def verify_code():
    data = request.json
    phone = data.get('phone')
    otp_code = data.get('otp')
    verification_check = client.verify.v2.services(verify_sid) \
        .verification_checks \
        .create(to="+91" + phone, code=otp_code)
    return jsonify({'success': verification_check.status, 'message': 'OTP verification ' + verification_check.status})


if __name__ == '__main__':
    app.run(debug=True)
