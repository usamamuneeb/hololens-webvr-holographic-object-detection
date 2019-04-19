from flask import Flask, render_template
from flask_socketio import SocketIO, emit,send
from flask import request
import sys
from base64 import b64decode


# SERVE STATIC PAGE
app = Flask(__name__,
            static_url_path='',
            static_folder='static',
            template_folder='static')
socketio = SocketIO(app)

clients = []

# SERVE STATIC PAGE
@app.route('/')
def index():
    return render_template('index.html')


# HANDLE NEW CLIENT CONNECTION
@socketio.on('connect')
def connect():
    requestParams = request.event['args'][0]
    print("New Client Connected: " + str(requestParams['REMOTE_ADDR']) + ":" + str(requestParams['REMOTE_PORT']))
    sys.stdout.flush()
    emit("to_client", "Welcome!")
    return "Welcome!"


# HANDLE DATA SENT TO SERVER
@socketio.on('to_server')
def handle_message(json):
    print('=> Received Data: ' + str(json))
    print('=> Echo\'ed Back: ' + str(json))
    sys.stdout.flush()
    emit("to_client", json)
    return json



# HANDLE PICTURE DATA SENT TO SERVER
@socketio.on('pic_to_server')
def handle_message(json):
    print('=> Received Data: ' + str(json))



    data_uri = str(json)
    header, encoded = data_uri.split(",", 1)
    data = b64decode(encoded)

    with open("image.jpg", "wb") as f:
        f.write(data)


    print('=> Echo\'ed Back: <DATA_URI>')
    sys.stdout.flush()
    emit("to_client", json)
    return json


# CREATE AN INSTANCE AND FIRE IT UP
if __name__ == '__main__':
    socketio.run(app)
#     app.run('0.0.0.0', 2222, debug=True)
