import React, { createContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

const SensorContext = createContext();

export const SensorProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState([]);
  const [odoData, setOdoData] = useState([]);
  const [socketConnected1, setSocketConnected1] = useState(false);
  const [socketConnected2, setSocketConnected2] = useState(false);
  const [socketConnected3, setSocketConnected3] = useState(false);
  const [gaugeValue, setGaugeValue] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [prevTimestamp, setPrevTimestamp] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [rfidData, setRfidData] = useState([]);

  const MAX_DATA_COUNT = 20;
  const MAX_SPEED = 350;

  useEffect(() => {
    const URL1 = "http://localhost:5002";
    const URL2 = "http://localhost:5000";
    const URL3 = "http://localhost:5001";
    const socket1 = io(URL1, {
      transports: ['websocket'],
      pingTimeout: 30000,
      pingInterval: 5000,
      upgradeTimeout: 30000,
      cors: {
        origin: "http://localhost:5173",
      }
    });
    const socket2 = io(URL2, {
      transports: ['websocket'],
      pingTimeout: 30000,
      pingInterval: 5000,
      upgradeTimeout: 30000,
      cors: {
        origin: "http://localhost:5173",
      }
    });
    const socket3 = io(URL3, {
      transports: ['websocket'],
      pingTimeout: 30000,
      pingInterval: 5000,
      upgradeTimeout: 30000,
      cors: {
        origin: "http://localhost:5173",
      }
    });
    socket1.connect();
    socket2.connect();
    socket3.connect();

    socket1.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });

    socket2.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });

    socket3.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });

    socket1.on('connect', () => {
      setSocketConnected1(true);
    });

    socket2.on('connect', () => {
      setSocketConnected2(true);
    });

    socket3.on('connect', () => {
      setSocketConnected3(true);
    });

    socket1.on('disconnect', () => {
      setSocketConnected1(false);
    });

    socket2.on('disconnect', () => {
      setSocketConnected2(false);
    });

    socket3.on('disconnect', () => {
      setSocketConnected3(false);
    });

    socket1.on('speed_update', (data) => {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      const { speed, timestamp } = parsedData;
      const newTimestamp = new Date(timestamp).getTime();

      setSensorData(prevData => {
        const newData = prevData.map(data => data.date === newTimestamp ? { ...data, speedRadar: speed } : data);
        if (!newData.find(data => data.date === newTimestamp)) {
          newData.push({ date: newTimestamp, speedRadar: speed, speedOdometer: null, time: new Date(newTimestamp).toLocaleString(), distance: totalDistance });
        }

        const newGaugeValue = speed > MAX_SPEED ? MAX_SPEED : speed;
        setGaugeValue(newGaugeValue);

        return newData.slice(-MAX_DATA_COUNT);
      });
    });

    socket2.on('rfid_data', (data) => {
      try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

        setRfidData(prevData => {
          const updatedData = [...prevData, parsedData].slice(-MAX_DATA_COUNT);
          return updatedData;
        });
      } catch (error) {
        console.error('Error parsing data:', error); // Log any parsing errors
      }
    });

    socket3.on('speed_data', (data) => {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      const { timestamp, speed_cm_per_s } = parsedData;
      const newTimestamp = new Date(timestamp).getTime();

      setOdoData(prevData => {
        const newData = prevData.map(data => data.date === newTimestamp ? { ...data, speedOdometer: speed_cm_per_s } : data);
        if (!newData.find(data => data.date === newTimestamp)) {
          newData.push({ date: newTimestamp, speedOdometer: speed_cm_per_s, time: new Date(newTimestamp).toLocaleString(), distance: totalDistance });
        }

        if (prevTimestamp !== null) {
          const timeDiff = (newTimestamp - prevTimestamp) / 60; // time difference in hours
          const incrementalDistance = speed_cm_per_s * timeDiff / 1000; // distance in kilometers (converting from cm/s to km/h)

          const updatedDistance = totalDistance + incrementalDistance;

          setTotalDistance(updatedDistance);

          const updatedData = newData.map((point, index) => ({
            ...point,
            distance: index === 0 ? 0 : parseFloat(updatedDistance.toFixed(2)),
          }));

          setPrevTimestamp(newTimestamp);
          return updatedData.slice(-MAX_DATA_COUNT);
        }

        setPrevTimestamp(newTimestamp);
        return newData.slice(-MAX_DATA_COUNT);
      });
    });

    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => {
      socket1.disconnect();
      socket2.disconnect();
      socket3.disconnect();
      clearInterval(interval);
    };
  }, [prevTimestamp, totalDistance]);

  return (
    <SensorContext.Provider value={{
      sensorData,
      odoData,
      socketConnected1,
      socketConnected2,
      socketConnected3,
      gaugeValue,
      totalDistance,
      currentTime,
      rfidData
    }}>
      {children}
    </SensorContext.Provider>
  );
};

export default SensorContext;
