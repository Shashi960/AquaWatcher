import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const InspectorDashboard = () => {
  const { apiFetch, logout, user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState('');
  const [remarks, setRemarks] = useState({});
  const [resolvedImages, setResolvedImages] = useState({});

  const load = async () => {
    const res = await apiFetch('/complaints');
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setComplaints(data);
  };

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, []);

  const handleResolvedImageChange = (id, event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setResolvedImages(prev => ({ ...prev, [id]: '' }));
      return;
    }
    // Limit resolved proof image size to less than 2 MB
    if (file.size > 2 * 1024 * 1024) {
      alert("Resolution proof image file size must be less than 2 MB.");
      event.target.value = ""; // Clear file input
      setResolvedImages(prev => ({ ...prev, [id]: '' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setResolvedImages(prev => ({ ...prev, [id]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const update = async (id, status) => {
    if (status === 'Resolved' && !resolvedImages[id]) {
      alert("Please upload a resolved proof image to mark this complaint as Resolved.");
      return;
    }

    const res = await apiFetch(`/complaints/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({
        status,
        remarks: remarks[id] || '',
        resolvedImage: resolvedImages[id] || ''
      })
    });
    const data = await res.json();
    setMessage(data.message);
    if (res.ok) {
      setResolvedImages(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      load();
    }
  };

  const input = { width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: '1px solid #ccd8cd', marginTop: 5, fontSize: '15px', background: '#fcfdfc', color: '#102613', outline: 'none', resize: 'vertical' };
  const logoutBtnStyle = { padding: '8px 16px', background: 'none', border: '1px solid #ccd8cd', borderRadius: 6, color: '#2d6a4f', fontWeight: 'bold', cursor: 'pointer' };

  return <main style={{ padding: '32px 24px', textAlign: 'left', maxWidth: 1000, margin: 'auto' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid #ccd8cd', paddingBottom: 16, marginBottom: 28 }}>
      <div>
        <h1 style={{ fontSize: 32, margin: 0, color: '#102613', letterSpacing: '-0.5px' }}>AEE Dashboard</h1>
        <p style={{ color: '#556b56', marginTop: 6, fontSize: 15 }}><strong>{user.name}</strong> · {user.ward}</p>
      </div>
      <button onClick={logout} style={logoutBtnStyle}>Logout</button>
    </header>

    {message && <p style={{ padding: 12, background: '#fef3c7', border: '1px solid #ccd8cd', borderRadius: 8, color: '#b45309', fontWeight: 'bold', marginBottom: 24 }}>{message}</p>}

    <section>
      <h2 style={{ color: '#102613', fontSize: 24, margin: '0 0 20px 0', fontWeight: 'bold' }}>Ward Water Issues</h2>
      {complaints.length === 0
        ? <p style={{ color: '#556b56' }}>No reported issues in this ward.</p>
        : <div style={{ display: 'grid', gap: 24 }}>
          {complaints.map((item) => <article key={item._id} style={{ border: '1px solid #ccd8cd', borderRadius: 12, padding: 24, background: '#ffffff', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#102613', fontSize: 20, fontWeight: 'bold' }}>{item.waterSourceName}</h3>
            
            <p style={{ margin: '8px 0', fontSize: 14, color: '#556b56' }}>
              <strong>Transaction ID:</strong>{' '}
              <code style={{ background: '#e8efe9', color: '#2d6a4f', padding: '4px 8px', borderRadius: 6, fontWeight: 'bold' }}>{item.transactionId || 'N/A'}</code>
            </p>

            <p style={{ margin: '6px 0' }}>
              <strong>Resident:</strong> {item.citizenName} &nbsp;·&nbsp;
              <strong>Status:</strong>{' '}
              <span style={{ fontWeight: 'bold', color: item.status === 'Resolved' ? '#2d6a4f' : item.status === 'In Progress' ? '#2563eb' : '#b45309' }}>{item.status}</span>
            </p>
            <p style={{ margin: '6px 0' }}><strong>Test results:</strong> {item.testResults}</p>
            <p style={{ margin: '8px 0', color: '#2c3e2e' }}>{item.description}</p>
            
            {item.testReportImage && <div style={{ marginTop: 14 }}>
              <strong>Resident Test Report:</strong><br />
              <img src={item.testReportImage} alt="Resident test report" style={{ maxWidth: 260, maxHeight: 180, borderRadius: 8, border: '1px solid #ccd8cd', marginTop: 6 }} />
            </div>}

            {item.status === 'Resolved' && item.resolvedImage && <div style={{ marginTop: 16, padding: 16, background: '#e8efe9', borderRadius: 8, border: '1px solid #ccd8cd' }}>
              <strong style={{ color: '#2d6a4f' }}>Resolution Proof Image:</strong><br />
              <img src={item.resolvedImage} alt="Resolved proof" style={{ maxWidth: 260, maxHeight: 180, borderRadius: 8, border: '1px solid #ccd8cd', marginTop: 8 }} />
              {item.engineerRemarks && <p style={{ margin: '10px 0 0 0', fontSize: 14, color: '#2c3e2e' }}><strong>Your Remarks:</strong> {item.engineerRemarks}</p>}
            </div>}

            {item.status !== 'Resolved' && <>
              <textarea
                value={remarks[item._id] || ''}
                onChange={(e) => setRemarks({ ...remarks, [item._id]: e.target.value })}
                placeholder="Engineer update / action taken"
                rows="2"
                style={{ ...input, display: 'block', marginTop: 16 }}
              />

              <div style={{ marginTop: 14, padding: 16, background: '#f4f7f4', borderRadius: 8, border: '1px solid #ccd8cd' }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#2c3e2e' }}>
                  Upload Resolved Proof Image (Required to resolve, Max 2 MB):
                  <input type="file" accept="image/*" onChange={(e) => handleResolvedImageChange(item._id, e)} style={{ display: 'block', marginTop: 8, width: '100%' }} />
                </label>
                {resolvedImages[item._id] && <img src={resolvedImages[item._id]} alt="Resolved proof preview" style={{ maxWidth: 200, maxHeight: 120, marginTop: 10, borderRadius: 6, border: '1px solid #ccd8cd' }} />}
              </div>

              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => update(item._id, 'In Progress')} style={{ padding: '10px 18px', background: '#f4f7f4', color: '#102613', border: '1px solid #ccd8cd', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>Mark In Progress</button>
                <button onClick={() => update(item._id, 'Resolved')} style={{ padding: '10px 18px', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>Mark Resolved</button>
              </div>
            </>}
          </article>)}
        </div>}
    </section>
  </main>;
};
