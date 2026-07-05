import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Droplets, Scale, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle } from 'lucide-react';

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
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    const [sourceRes, complaintRes] = await Promise.all([apiFetch('/sources'), apiFetch('/complaints')]);
    setSources(await sourceRes.json());
    setComplaints(await complaintRes.json());
  };

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, []);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

  const input = { width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 8, border: '1px solid #ccd8cd', marginTop: 5, fontSize: '15px', background: '#fcfdfc', color: '#102613', outline: 'none', fontFamily: 'inherit' };
  const buttonStyle = { padding: '12px 24px', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      
      {/* ── TOP HEADER (Dark Green) ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: '#102613',
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '2px solid #2d6a4f',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Droplets color="#4ade80" size={32} />
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ margin: 0, fontSize: 22, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.2, fontWeight: 700 }}>AquaWatcher</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#86efac', letterSpacing: '0.5px' }}>Resident Portal · {user.ward}</p>
          </div>
        </div>
        <button onClick={logout} style={{ padding: '8px 16px', background: 'none', border: '1px solid #4ade80', borderRadius: 6, color: '#4ade80', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>Logout</button>
      </header>

      {/* ── MAIN LAYOUT (Side-by-Side Grid) ── */}
      <main style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: '40px 20px', flex: 1, boxSizing: 'border-box' }}>
        
        {/* User Info Welcome Panel */}
        <div style={{
          background: '#ffffff', border: '1px solid #ccd8cd', borderRadius: 12, padding: '16px 20px', marginBottom: 28,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          boxShadow: 'var(--shadow)'
        }}>
          <div>
            <span style={{ fontSize: 14, color: '#556b56', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Welcome Resident</span>
            <h2 style={{ fontSize: 22, margin: '2px 0 0', color: '#102613', fontWeight: 700 }}>{user.name}</h2>
          </div>
          <div style={{ textAlign: 'right', fontSize: 14, color: '#2c3e2e' }}>
            <strong>Address:</strong> {user.address}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 32,
          alignItems: 'start'
        }}>

          {/* LEFT COLUMN: Reporting Form */}
          <section style={{ padding: '28px 24px', background: '#ffffff', borderRadius: 12, border: '1px solid #ccd8cd', boxShadow: 'var(--shadow)' }}>
            <h2 style={{ color: '#102613', fontSize: 22, margin: '0 0 6px 0', fontWeight: 'bold' }}>Report a Tested Water Issue</h2>
            <p style={{ color: '#556b56', margin: '0 0 20px 0', fontSize: 14 }}>Sources are predefined for your registered ward. One issue may be reported every 7 days.</p>
            
            <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e2e' }}>Predefined water source</label>
                <select style={input} required value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                  <option value="">Select a source</option>
                  {sources.map((source) => <option value={source._id} key={source._id}>{source.name} — {source.type}</option>)}
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e2e' }}>pH Value (0.0 - 14.0)</label>
                  <input type="number" min="0" max="14" step="0.1" style={input} required value={pH} onChange={(e) => setPH(e.target.value)} placeholder="e.g. 7.2" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e2e' }}>TDS Value (ppm)</label>
                  <input type="number" min="0" style={input} required value={tds} onChange={(e) => setTds(e.target.value)} placeholder="e.g. 300" />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, cursor: 'pointer', fontSize: 14, fontWeight: 'bold', color: '#2c3e2e' }}>
                <input type="checkbox" checked={turbidity} onChange={(e) => setTurbidity(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#2d6a4f' }} />
                <span>High Turbidity / Muddy Water</span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e2e' }}>Issue description</label>
                <textarea style={{ ...input, resize: 'vertical' }} required rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the water quality problem..." />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e2e' }}>Test report image (Max 2 MB)</label>
                <input style={input} type="file" accept="image/*" required onChange={imageChanged} />
              </div>
              {image && <img src={image} alt="Test report preview" style={{ maxWidth: 220, maxHeight: 150, borderRadius: 8, border: '1px solid #ccd8cd', marginTop: 4 }} />}
              
              <button style={{ ...buttonStyle, justifySelf: 'start', marginTop: 10 }}>Submit water issue</button>
            </form>
          </section>

          {/* RIGHT COLUMN: Track Complaints */}
          <section style={{ padding: '28px 24px', background: '#ffffff', borderRadius: 12, border: '1px solid #ccd8cd', boxShadow: 'var(--shadow)' }}>
            <h2 style={{ color: '#102613', fontSize: 22, margin: '0 0 16px 0', fontWeight: 'bold' }}>Track your issues</h2>
            {message && <p style={{ padding: 12, background: '#fef3c7', border: '1px solid #ccd8cd', borderRadius: 8, color: '#b45309', fontWeight: 'bold', marginBottom: 16 }}>{message}</p>}
            
            {complaints.length === 0 ? (
              <p style={{ color: '#556b56' }}>No water issues submitted yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {complaints.map((item) => {
                  const isExpanded = !!expanded[item._id];
                  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
                  const timeDiff = Date.now() - new Date(item.createdAt).getTime();
                  const timeLeft = WEEK_MS - timeDiff;
                  const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
                  const hoursLeft = Math.ceil((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

                  const eligible = item.status !== 'Resolved' && timeLeft <= 0;

                  return (
                    <article key={item._id} className="hover-card" style={{ border: '1px solid #ccd8cd', borderRadius: 10, overflow: 'hidden', background: '#fbfcfb' }}>
                      
                      {/* Collapsible Header */}
                      <div 
                        onClick={() => toggleExpand(item._id)}
                        className="accordion-header"
                        style={{
                          padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          cursor: 'pointer', background: '#e8efe9', borderBottom: isExpanded ? '1px solid #ccd8cd' : 'none'
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <h3 style={{ margin: 0, color: '#102613', fontSize: 16, fontWeight: 'bold' }}>{item.waterSourceName}</h3>
                          <span style={{ fontSize: 12, color: '#556b56' }}>ID: {item.transactionId || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 'bold',
                            background: item.status === 'Resolved' ? '#2d6a4f' : '#f59e0b',
                            color: '#ffffff'
                          }}>
                            {item.status}
                          </span>
                          {isExpanded ? <ChevronUp size={18} color="#2d6a4f" /> : <ChevronDown size={18} color="#2d6a4f" />}
                        </div>
                      </div>

                      {/* Collapsible Body */}
                      <div 
                        className="accordion-body"
                        style={{
                          maxHeight: isExpanded ? '1000px' : '0px',
                          opacity: isExpanded ? 1 : 0,
                          padding: isExpanded ? '18px' : '0px 18px',
                          overflow: 'hidden',
                          background: '#ffffff',
                          textAlign: 'left',
                          fontSize: '14px'
                        }}
                      >
                        <p style={{ margin: '4px 0' }}><strong>Assigned AEE:</strong> {item.assignedEngineerName}</p>
                        <p style={{ margin: '4px 0' }}><strong>Test results:</strong> {item.testResults}</p>
                        <p style={{ margin: '8px 0', color: '#2c3e2e', lineHeight: 1.5 }}>{item.description}</p>
                        
                        {item.testReportImage && <div style={{ marginTop: 12 }}>
                          <strong>Test Report Image:</strong><br />
                          <img src={item.testReportImage} alt="Submitted test report" style={{ maxWidth: '100%', maxHeight: 150, marginTop: 6, borderRadius: 8, border: '1px solid #ccd8cd' }} />
                        </div>}

                        {item.resolvedImage && <div style={{ marginTop: 14, padding: 12, background: '#e8efe9', borderRadius: 8, border: '1px solid #ccd8cd' }}>
                          <strong style={{ color: '#2d6a4f' }}>Resolution Proof Image:</strong><br />
                          <img src={item.resolvedImage} alt="Resolution proof" style={{ maxWidth: '100%', maxHeight: 150, marginTop: 6, borderRadius: 8, border: '1px solid #ccd8cd' }} />
                          {item.engineerRemarks && <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#2c3e2e' }}><strong>Remarks:</strong> {item.engineerRemarks}</p>}
                        </div>}

                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #ccd8cd' }}>
                          <p style={{ fontSize: 12, color: '#556b56' }}>Filed: {new Date(item.createdAt).toLocaleString()}</p>
                          
                          {/* Lawyer Notice Countdown/Action Panel */}
                          {item.status !== 'Resolved' && (
                            <div style={{
                              marginTop: 12, padding: '12px 14px', borderRadius: 8,
                              background: eligible ? '#fde8e8' : '#e8efe9',
                              border: `1px solid ${eligible ? '#f8b4b4' : '#ccd8cd'}`,
                              color: eligible ? '#9b1c1c' : '#2c3e2e'
                            }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <AlertTriangle size={16} />
                                <strong style={{ fontSize: 13 }}>
                                  {eligible ? 'AEE SLA Exceeded' : 'Legal Compliance Countdown'}
                                </strong>
                              </div>
                              <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>
                                {eligible ? (
                                  'This complaint has remained unresolved for more than 7 days. You are now legally eligible to file an official lawyer notice against the AEE.'
                                ) : (
                                  `AEE ${item.assignedEngineerName} has ${daysLeft} days and ${hoursLeft} hours left to resolve this issue. You can file an official lawyer notice after 7 days if unresolved.`
                                )}
                              </p>
                            </div>
                          )}

                          {eligible && !item.legalNoticeFiledAt && (
                            <button onClick={() => fileNotice(item._id)} className="hover-button" style={{ marginTop: 12, padding: '10px 18px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                              File official lawyer notice against AEE
                            </button>
                          )}

                          {item.legalNoticeFiledAt && (
                            <div style={{ marginTop: 12, padding: '10px 12px', background: '#fde8e8', color: '#9b1c1c', fontWeight: 'bold', borderRadius: 6, border: '1px solid #f8b4b4' }}>
                              ⚖️ Official lawyer notice filed on: {new Date(item.legalNoticeFiledAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                    </article>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </main>

      {/* ── FOOTER (Dark Green) ── */}
      <footer style={{
        background: 'rgba(8, 20, 10, 0.92)',
        backdropFilter: 'blur(4px)',
        padding: '40px 20px',
        textAlign: 'center',
        borderTop: '1px solid rgba(45,106,79,0.4)',
        width: '100%',
        boxSizing: 'border-box',
        marginTop: 40
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
            <Scale size={20} color="#86efac" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '0.2px' }}>
              AquaWatcher Legal Compliance Auditing System
            </span>
          </div>
          <p style={{
            margin: '0 0 18px', color: '#7a9c7e', fontSize: 13, lineHeight: '1.7',
          }}>
            This portal is an open-source initiative designed to align municipal water governance with
            United Nations Sustainable Development Goal 6 (Clean Water and Sanitation) and verify
            environmental rights enforcement.
          </p>
          <p style={{ margin: 0, color: '#4a7c59', fontWeight: 700, fontSize: 13 }}>
            © {new Date().getFullYear()} AquaWatcher Department of Environmental Governance
          </p>
        </div>
      </footer>

    </div>
  );
};
