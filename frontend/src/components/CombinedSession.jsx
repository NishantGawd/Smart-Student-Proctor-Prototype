import React, { useRef, useState } from 'react';
import { LineChart, Line, YAxis, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    let status = "Focused";
    if (val === 2) status = "Happy/Excited";
    if (val === 0.5) status = "Confused";
    if (val === 0) status = "Proctor Alert";

    return (
      <div style={{ background: 'rgba(30, 30, 30, 0.9)', padding: '10px', borderRadius: '8px', border: '1px solid #444', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '0.9rem', color: '#4FC3F7' }}>{status}</p>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#aaa' }}>Time: {label}</p>
      </div>
    );
  }
  return null;
};

const CombinedSession = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isStarted, setIsStarted] = useState(false);
  const [data, setData] = useState({ status: 'Idle', color: '#333', gaze: 'Waiting', message: 'Click Start' });
  const [graph, setGraph] = useState([]);

  const startSession = async () => {
    try {
      videoRef.current.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
      setIsStarted(true);
      connectWebSocket();
    // eslint-disable-next-line no-unused-vars
    } catch (err) { alert("Camera Denied"); }
  };

  const connectWebSocket = () => {
    socketRef.current = new WebSocket('ws://localhost:8000/ws/student');
    socketRef.current.onopen = () => setInterval(sendFrame, 200);
    socketRef.current.onmessage = (e) => {
      const res = JSON.parse(e.data);
      setData(res);
      setGraph(prev => [...prev, { time: new Date().toLocaleTimeString(), val: res.status === 'Happy' ? 2 : res.status === 'Confused' ? 0.5 : res.status === 'Proctor Alert' ? 0 : 1 }].slice(-50));
    };
  };

  const sendFrame = () => {
    if (videoRef.current && socketRef.current?.readyState === 1) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      socketRef.current.send(canvasRef.current.toDataURL('image/jpeg', 0.5));
    }
  };

  const getBg = () => {
    const colors = { green: '#2E7D32', blue: '#1565C0', yellow: '#F9A825', red: '#C62828' };
    return colors[data.color] || '#333';
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#121212', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Segoe UI, sans-serif' }}>
      {!isStarted && <button onClick={startSession} style={{ padding: '15px 40px', fontSize: '20px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer' }}>Start Session</button>}
      
      <div style={{ display: isStarted ? 'flex' : 'none', width: '90%', maxWidth: '1200px', height: '80vh', gap: '30px' }}>
        
        <div style={{ flex: 1.5, background: '#1E1E1E', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontWeight: 500 }}>Student Portal</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,0,0,0.1)', padding: '5px 12px', borderRadius: '20px', color: '#FF5252' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>● LIVE</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            </div>
          </div>
          <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', background: '#000', position: 'relative' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ flex: 0.8, background: getBg(), borderRadius: '16px', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', transition: 'background-color 0.3s ease' }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '3rem', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{data.status}</h1>
            <p style={{ margin: 0, fontSize: '1.2rem', opacity: 0.9 }}>{data.message}</p>
            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)', margin: '20px 0' }}></div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '400' }}>{data.gaze}</h2>
            <span style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '5px' }}>GAZE DIRECTION</span>
          </div>

          <div style={{ flex: 1, background: '#1E1E1E', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#aaa', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Engagement Timeline</h3>
            <div style={{ width: '100%', height: '85%' }}>
              <ResponsiveContainer>
                <LineChart data={graph}>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[0, 2.2]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 }} />
                  <Line type="stepAfter" dataKey="val" stroke="#4FC3F7" strokeWidth={3} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CombinedSession;