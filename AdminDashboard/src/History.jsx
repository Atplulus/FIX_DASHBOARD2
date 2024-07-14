import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { TableVirtuoso } from 'react-virtuoso';
import SensorContext from './contexts/SensorContext';

const columns = [
  { label: 'Time', dataKey: 'time' },
  { label: 'Speed Radar FMCW (cm/s)', dataKey: 'speedRadar', numeric: true },
  { label: 'Speed Odometer (cm/s)', dataKey: 'speedOdometer', numeric: true },
  { label: 'Distance (Km)', dataKey: 'distance', numeric: true },
];

const VirtuosoTableComponents = {
  Scroller: React.forwardRef((props, ref) => (
    <Box component={Paper} {...props} ref={ref} sx={{ width: '100%' }} />
  )),
  Table: (props) => (
    <table {...props} style={{ borderCollapse: 'collapse', width: '100%' }} />
  ),
  TableHead: React.forwardRef((props, ref) => (
    <thead {...props} ref={ref} style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#fff' }} />
  )),
  TableRow: ({ item: _item, ...props }) => <tr {...props} style={{ display: 'flex', width: '100%' }} />,
  TableCell: ({ item: _item, ...props }) => (
    <td {...props} style={{ flex: 1, padding: '8px', borderBottom: '1px solid #ddd', borderRight: '1px solid #ddd', textAlign: 'center' }} />
  ),
  TableBody: React.forwardRef((props, ref) => <tbody {...props} ref={ref} style={{ display: 'flex', flexDirection: 'column' }} />),
};

function fixedHeaderContent() {
  return (
    <tr style={{ display: 'flex', width: '100%' }}>
      {columns.map((column) => (
        <th
          key={column.dataKey}
          style={{
            flex: 1,
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderBottom: '1px solid #ddd',
            borderRight: '1px solid #ddd',
            textAlign: 'center',
          }}
        >
          {column.label}
        </th>
      ))}
    </tr>
  );
}

function rowContent(index, data) {
  const row = data[index];
  return (
    <tr style={{ display: 'flex', width: '100%' }}>
      {columns.map((column) => (
        <td
          key={column.dataKey}
          style={{
            flex: 1,
            padding: '8px',
            borderBottom: '1px solid #ddd',
            borderRight: '1px solid #ddd',
            textAlign: column.numeric ? 'center' : 'center',
          }}
        >
          {row[column.dataKey]}
        </td>
      ))}
    </tr>
  );
}

export default function HistoryPage() {
  const { sensorData, odoData } = useContext(SensorContext);

  // Combine sensorData and odoData into a single array, sorted by timestamp
  const combinedData = [...sensorData, ...odoData].sort((a, b) => a.date - b.date);

  // Update combinedData to split the speed values appropriately
  const updatedData = combinedData.map(data => ({
    ...data,
    speedRadar: data.speedRadar !== undefined ? data.speedRadar : null,
    speedOdometer: data.speedOdometer !== undefined ? data.speedOdometer : null,
    distance: data.distance !== undefined ? data.distance : 0,
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box sx={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Paper sx={{ height: 'calc(100vh - 8rem)', width: '90%', overflow: 'hidden', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
          <TableVirtuoso
            data={updatedData}
            components={VirtuosoTableComponents}
            fixedHeaderContent={fixedHeaderContent}
            itemContent={(index) => rowContent(index, updatedData)}
          />
        </Paper>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <Link to='/'>
          <button className="back-button">Back to Home</button>
        </Link>
      </Box>
    </Box>
  );
}
