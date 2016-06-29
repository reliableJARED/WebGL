#http://blog.miguelgrinberg.com/post/easy-websockets-with-flask-and-gevent
#http://flask-socketio.readthedocs.org/en/latest/
from flask import Flask, render_template, session, request
from flask_socketio import SocketIO
from flask.ext.socketio import emit, send
import time
import json
import random
import threading



app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

global coinCount
 
@app.route('/')
def index():
    return render_template('voxelPaintPhysics.html')

@socketio.on('connect', namespace='/')
def test_connect():
    print "new connection"

@socketio.on('disconnect', namespace='/')
def test_disconnect():
    print 'user disconnected'

@socketio.on('message')
def handle_message(data):
    dataIN = json.loads(data)
    print dataIN
    emit('message',json.dumps(dataIN),broadcast=True)
    
  
if __name__ == '__main__':
    #CHANGE HOST
    ip = raw_input("Enter host ip to use: ")
    socketio.run(app,host=ip,port=8000)
