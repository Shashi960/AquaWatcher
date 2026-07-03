import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const CitizenDashboard = () => {
  const { apiFetch, logout, user } = useAuth();
  const [sources, setSources] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [sourceId, setSourceId] = useState('');
  const [description, setDescription] = useState('');
  const [pH, setPH] = useState('');
  const [tds, setTds] = useState('');
  const [turbidity, setTurbidity] = useState(false);
  const [image, setImage] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const [sourceRes, complaintRes] = await Promise.all([apiFetch('/sources'), apiFetch('/complaints')]);
    setSources(await sourceRes.json());
    setComplaints(await complaintRes.json());
  };

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const res = await apiFetch('/complaints', {
        method: 'POST',
        body: JSON.stringify({
          waterSourceId: sourceId,
          description,
          pH: Number(pH),
          tds: Number(tds),
          turbidity: Boolean(turbidity),
          testReportImage: image
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message);
      setSourceId('');
      setDescription('');
      setPH('');
      setTds('');
      setTurbidity(false);
      setImage('');
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const imageChanged = (event) => {
    const file = event.target.files?.[0];
    if (!file) return setImage('');
    
    // Validate image size is less than 2 MB
    if (file.size > 2 * 1024 * 1024) {
      alert("Image file size must be less than 2 MB.");
      event.target.value = ""; // Clear input
      return setImage('');
    }

    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const fileNotice = async (id) => {
    const res = await apiFetch(`/complaints/${id}/legal-notice`, { method: 'POST' });
    const data = await res.json();
    setMessage(data.message);
    if (res.ok) load();
  };

  const input = { width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: '1px solid #ccd8cd', marginTop: 5, fontSize: '15px', background: '#fcfdfc', color: '#102613', outline: 'none' };
  const buttonStyle = { padding: '10px 20px', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' };
  const logoutBtnStyle = { padding: '8px 16px', background: 'none', border: '1px solid #ccd8cd', borderRadius: 6, color: '#2d6a4f', fontWeight: 'bold', cursor: 'pointer' };

  return <main style={{ padding: '32px 24px', textAlign: 'left', maxWidth: 1000, margin: 'auto' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #ccd8cd', paddingBottom: 16, marginBottom: 28 }}>
      <div>
        <h1 style={{ fontSize: 32, margin: 0, color: '#102613', letterSpacing: '-0.5px' }}>Resident Dashboard</h1>
        <p style={{ color: '#556b56', marginTop: 6, fontSize: 15 }}><strong>{user.name}</strong> · {user.ward} · {user.address}</p>
      </div>
      <button onClick={logout} style={logoutBtnStyle}>Logout</button>
    </header>

    <section style={{ padding: '28px 24px', background: '#ffffff', borderRadius: 12, border: '1px solid #ccd8cd', boxShadow: 'var(--shadow)' }}>
      <h2 style={{ color: '#102613', fontSize: 22, margin: '0 0 6px 0', fontWeight: 'bold' }}>Report a Tested Water Issue</h2>
      <p style={{ color: '#556b56', margin: '0 0 20px 0', fontSize: 14 }}>Sources are predefined for your registered ward. One issue may be reported every 7 days.</p>
      
      <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
        <label style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e2e' }}>Predefined water source
          <select style={input} required value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            <option value="">Select a source</option>
            {sources.map((source) => <option value={source._id} key={source._id}>{source.name} — {source.type}</option>)}
          </select>
        </label>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <label style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e2e' }}>pH Value (0.0 - 14.0)
            <input type="number" min="0" max="14" step="0.1" style={input} required value={pH} onChange={(e) => setPH(e.target.value)} placeholder="e.g. 7.2" />
          </label>
          <label style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e2e' }}>TDS Value (ppm)
            <input type="number" min="0" style={input} required value={tds} onChange={(e) => setTds(e.target.value)} placeholder="e.g. 300" />
          </label>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, cursor: 'pointer', fontSize: 14, fontWeight: 'bold', color: '#2c3e2e' }}>
          <input type="checkbox" checked={turbidity} onChange={(e) => setTurbidity(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#2d6a4f' }} />
          <span>High Turbidity / Muddy Water</span>
        </label>

        <label style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e2e' }}>Issue description
          <textarea style={{ ...input, resize: 'vertical' }} required rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the water quality problem..." />
        </label>

        <label style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e2e' }}>Test report image (Max 2 MB)
          <input style={input} type="file" accept="image/*" required onChange={imageChanged} />
        </label>
        {image && <img src={image} alt="Test report preview" style={{ maxWidth: 220, maxHeight: 150, borderRadius: 8, border: '1px solid #ccd8cd', marginTop: 4 }} />}
        
        <button style={{ ...buttonStyle, justifySelf: 'start', marginTop: 10 }}>Submit water issue</button>
      </form>
    </section>

    {message && <p style={{ marginTop: 20, padding: 12, background: '#fef3c7', border: '1px solid #ccd8cd', borderRadius: 8, color: '#b45309', fontWeight: 'bold' }}>{message}</p>}

    <section style={{ marginTop: 40 }}>
      <h2 style={{ color: '#102613', fontSize: 24, margin: '0 0 16px 0', fontWeight: 'bold' }}>Track your issues</h2>
      {complaints.length === 0 ? <p style={{ color: '#556b56' }}>No water issues submitted yet.</p> : <div style={{ display: 'grid', gap: 20 }}>
        {complaints.map((item) => {
          const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
          const eligible = item.status !== 'Resolved' && (Date.now() - new Date(item.createdAt).getTime()) <= WEEK_MS;
          
          return <article key={item._id} style={{ border: '1px solid #ccd8cd', padding: 24, borderRadius: 12, background: '#ffffff', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ margin: 0, color: '#102613', fontSize: 20, fontWeight: 'bold' }}>{item.waterSourceName}</h3>
            
            <p style={{ margin: '10px 0', fontSize: 14, color: '#556b56' }}>
              <strong>Transaction ID:</strong> <code style={{ background: '#e8efe9', color: '#2d6a4f', padding: '4px 8px', borderRadius: 6, fontWeight: 'bold' }}>{item.transactionId || 'N/A'}</code>
            </p>
            
            <p style={{ margin: '6px 0' }}><strong>Status:</strong> <span style={{ fontWeight: 'bold', color: item.status === 'Resolved' ? '#2d6a4f' : '#b45309' }}>{item.status}</span> · <strong>Assigned AEE:</strong> {item.assignedEngineerName}</p>
            <p style={{ margin: '6px 0' }}><strong>Test results:</strong> {item.testResults}</p>
            <p style={{ margin: '8px 0', color: '#2c3e2e' }}>{item.description}</p>
            
            {item.testReportImage && <div style={{ marginTop: 14 }}>
              <strong>Test Report Image:</strong><br/>
              <img src={item.testReportImage} alt="Submitted test report" style={{ maxWidth: 220, maxHeight: 150, marginTop: 6, borderRadius: 8, border: '1px solid #ccd8cd' }} />
            </div>}

            {item.resolvedImage && <div style={{ marginTop: 16, padding: 16, background: '#e8efe9', borderRadius: 8, border: '1px solid #ccd8cd' }}>
              <strong style={{ color: '#2d6a4f' }}>Resolution Proof Image (uploaded by Engineer):</strong><br/>
              <img src={item.resolvedImage} alt="Resolution proof" style={{ maxWidth: 260, maxHeight: 180, marginTop: 8, borderRadius: 8, border: '1px solid #ccd8cd' }} />
              {item.engineerRemarks && <p style={{ margin: '10px 0 0 0', fontSize: 14, color: '#2c3e2e' }}><strong>Engineer Remarks:</strong> {item.engineerRemarks}</p>}
            </div>}

            <p style={{ fontSize: 12, color: '#556b56', marginTop: 16 }}>Filed: {new Date(item.createdAt).toLocaleString()}</p>
            
            {eligible && !item.legalNoticeFiledAt && <button onClick={() => fileNotice(item._id)} style={{ marginTop: 14, padding: '10px 18px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>File legal notice against AEE</button>}
            {item.legalNoticeFiledAt && <div style={{ marginTop: 14, color: '#dc2626', fontWeight: 'bold' }}>Legal notice filed: {new Date(item.legalNoticeFiledAt).toLocaleString()}</div>}
          </article>;
        })}
      </div>}
    </section>
  </main>;
};
