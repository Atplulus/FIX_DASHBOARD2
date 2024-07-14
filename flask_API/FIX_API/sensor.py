#socketcontext3 
from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import Jetson.GPIO as GPIO
import time
import numpy as np
import logging
import os


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')
CORS(app, origins=["http://localhost:5173"])


# Setup GPIO
RPM_PIN = 17  # Pin GPIO sesuai dengan penomoran BCM
GPIO.setmode(GPIO.BCM)
GPIO.setup(RPM_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# Variabel untuk menyimpan jumlah pulsa dan waktu
counter = 0
previousMillis = int(time.time() * 1000)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger()

# Callback untuk interrupt dengan debouncing
def pulsecount(channel):
    global counter
    counter += 1

# Event detect untuk input pin dengan debouncing time 5 ms
GPIO.add_event_detect(RPM_PIN, GPIO.RISING, callback=pulsecount, bouncetime=5)

def calculate_rpm(counter):
    # Hitung RPM
    pulses_per_revolution = 20  # Disk memiliki 20 lubang
    rpm = (counter / pulses_per_revolution) * 60
    return rpm

def rpm_to_speed(rpm, diameter):
    # Mengubah RPM menjadi kecepatan linier dalam cm/s
    circumference = np.pi * diameter  # Keliling roda dalam cm
    speed_cm_per_s = (rpm * circumference) / 60
    return speed_cm_per_s

# Diameter roda dalam cm
wheel_diameter = 6

def generate_filename(base_name="Pengukuran_odometer_DC"):
    filename = f"{base_name}.csv"
    counter = 1

    while os.path.isfile(filename):
        filename = f"{base_name} {counter}.csv"
        counter += 1

    return filename

@socketio.on('connect')
def handle_connect():
    logger.info("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    logger.info("Client disconnected")

def send_speed_data():
    global counter, previousMillis
    filename = generate_filename()
    results = []

    try:
        while True:
            currentMillis = int(time.time() * 1000)
            if currentMillis - previousMillis >= 1000:
                current_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
                rpm = calculate_rpm(counter)
                speed_cm_per_s = rpm_to_speed(rpm, wheel_diameter)
                results.append((current_time, rpm, speed_cm_per_s))
                logger.info(f"Timestamp: {current_time}, RPM: {rpm:.2f}, Speed: {speed_cm_per_s:.2f} cm/s")
                
                socketio.emit('speed_data', {'timestamp': current_time, 'rpm': rpm, 'speed_cm_per_s': speed_cm_per_s})
                logger.info("Data sent to websocket")

                counter = 0
                previousMillis += 1000
            socketio.sleep(0.2)

    except KeyboardInterrupt:
        logger.info("Pengukuran dihentikan oleh pengguna.")
    
    finally:
        # Menyimpan hasil pengukuran ke dalam file CSV
        with open(filename, mode='w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(["Timestamp", "RPM", "Speed (cm/s)"])
            for current_time, rpm, speed_cm_per_s in results:
                writer.writerow([current_time, rpm, speed_cm_per_s])
                logger.info(f"Menulis ke CSV: Timestamp: {current_time}, RPM: {rpm}, Speed: {speed_cm_per_s} cm/s")
        
        GPIO.cleanup()
        logger.info(f"Pengukuran selesai. Hasil disimpan dalam {filename}.")

if __name__ == '__main__':
    socketio.start_background_task(target=send_speed_data)
    socketio.run(app, host='0.0.0.0', port=5001)
