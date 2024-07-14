import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import GaugeComponent from 'react-gauge-component';
import logo from './assets/Images/Logo-PT-INKA.png';
import SensorContext from './contexts/SensorContext';

function Home() {
  const {
    sensorData,
    odoData,
    socketConnected1,
    socketConnected2,
    gaugeValue,
    totalDistance,
    currentTime,
    rfidData
  } = useContext(SensorContext);

  const MAX_SPEED = 120;

  const gaugeLimits = [
    { color: '#00ff00', limit: 80 },
    { color: '#ffff00', limit: 130 },
    { color: '#F58B19', limit: 200 },
    { color: '#ff0000', limit: MAX_SPEED }
  ];

  const navigate = useNavigate();
  const validTotalDistance = !isNaN(totalDistance) ? totalDistance.toFixed(2) : '0.00';

  return (
    <main className='main-container'>
      <div className='gauge-chart'>
        <h3>Gauge Chart</h3>
        <GaugeComponent
          className='gauge-component'
          arc={{
            nbSubArcs: gaugeLimits.length,
            colorArray: gaugeLimits.map(limit => limit.color),
            width: 0.3,
            padding: 0.003
          }}
          labels={{
            valueLabel: {
              fontSize: 40,
              formatTextValue: value => `${value.toFixed(2)} cm/s`
            }
          }}
          value={gaugeValue}
          maxValue={MAX_SPEED}
        />
      </div>
      <div className='main-cards'>
        <div className='card'>
          <div className='card-inner'>
            <h3>Speed Radar</h3>
          </div>
          <div className="d-flex align-items-center">
            <h2 id='speedValue'>{sensorData.length > 0 && sensorData[sensorData.length - 1].speedRadar !== null ? sensorData[sensorData.length - 1].speedRadar : 'N/A'}</h2>
            <span className="unit">cm/s</span>
          </div>
        </div>
        <div className='card'>
          <div className='card-inner'>
            <h3>Speed Odometer</h3>
          </div>
          <div className="d-flex align-items-center">
            <h2 id='speedValue'>{odoData.length > 0 && odoData[odoData.length - 1].speedOdometer !== null ? odoData[odoData.length - 1].speedOdometer : 'N/A'}</h2>
            <span className="unit">cm/s</span>
          </div>
        </div>
        <div className='card'>
          <div className='card-inner'>
            <h3>Train Position</h3>
          </div>
          <div className="d-flex align-items-center">
            <h2>{validTotalDistance}</h2>
            <span className="unit">km</span>
          </div>
        </div>
        <div className='card'>
          <div className='card-inner'>
            <h3>Block</h3>
          </div>
          <div className="d-flex align-items-center">
            <h2>{rfidData.length > 0 ? rfidData[rfidData.length - 1].name : 'Stand by ...'}</h2>
            <h3>{rfidData.length > 0 ? rfidData[rfidData.length - 1].tag_id : 'Reading ...'}</h3>
          </div>
        </div>
      </div>
      <div className='button-container'>
        <div className='company'>
          <div className="d-flex align-items-center">
            <img src={logo} alt="PT.Inka" className="company-logo" />
          </div>
        </div>
        <div className='info-card'>
          <div className="d-flex align-items-center">
            <h2>{currentTime}</h2>
          </div>
        </div>
        <div className='button'>
          <button onClick={() => navigate('/history')}>History</button>
        </div>
      </div>
      <div className='line-chart'>
        <h3>Chart Speed Over Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={sensorData.concat(odoData)} // Merge sensorData and odoData for the chart
            margin={{
              top: 5,
              right: 30,
              left: 10,
              bottom: 9,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" label={{ value: "Time", position: 'insideBottomRight', offset: 0 }} />
            <YAxis label={{ value: "Speed (cm/s)", angle: -90, position: 'insideLeft', dx: 4, dy: 50 }}
              domain={[0, MAX_SPEED]}
              ticks={[0, 40, 80, 120]}
            />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="speedRadar" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="speedOdometer" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}

export default Home;
