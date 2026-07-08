import React, { useState } from 'react';
import { Droplets, LogIn, UserPlus, ShieldCheck, Scale, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Citizen Reports Purity Issue',
    desc: 'Citizens log in, select the water source in their ward, enter pH, TDS, turbidity values, and upload a test report image as proof.',
  },
  {
    step: 2,
    title: 'AEE Review & SLA',
    desc: 'The Assistant Executive Engineer audits report details, validates the urgency, and takes action with an SLA of 7 days.',
  },
  {
    step: 3,
    title: 'Lab Testing & Remediation',
    desc: 'The AEE conducts chemical and bacteriological testing (pH, TDS, turbidity), logs parameters, and updates remediation progress.',
  },
];

export const AuthPage = () => {
  const { login, register, verifyPhone } = useAuth();
  const [mode, setMode] = useState('login');
  const [phone, setPhone] = useState('');
  const [resident, setResident] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Tenant registration states
  const [isTenant, setIsTenant] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantAadhaar, setTenantAadhaar] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantOriginalAddress, setTenantOriginalAddress] = useState('');
  const [tenantRentalCopy, setTenantRentalCopy] = useState('');
  const [tenantWard, setTenantWard] = useState('Ward 1 - Gandhi Nagar');

  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingError, setTrackingError] = useState('');
  const [trackingBusy, setTrackingBusy] = useState(false);

  const verify = async () => {
    setBusy(true); setMessage('');
    try { setResident(await verifyPhone(phone)); } catch (error) { setResident(null); setMessage(error.message); } finally { setBusy(false); }
  };

  const handleRentalCopyChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image file size must be less than 2 MB.");
      e.target.value = "";
      return setTenantRentalCopy('');
    }
    const reader = new FileReader();
    reader.onload = () => setTenantRentalCopy(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (mode === 'forgot') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, email, newPassword: password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setMessage(data.message);
        setMode('login');
        setPhone('');
        setEmail('');
        setPassword('');
      } else if (mode === 'register') {
        if (isTenant) {
          await register({
            isTenant: true,
            name: tenantName,
            aadhaarNumber: tenantAadhaar,
            phone: tenantPhone,
            originalAddress: tenantOriginalAddress,
            rentalCopyImage: tenantRentalCopy,
            ward: tenantWard,
            email,
            password
          });
        } else {
          if (!resident) throw new Error('Verify the Aadhaar-linked mobile number first.');
          await register({
            isTenant: false,
            phone,
            email,
            password
          });
        }
      } else await login(email, password);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  const track = async (event) => {
    event.preventDefault();
    if (!trackingId.trim()) return;
    setTrackingBusy(true); setTrackingError(''); setTrackingResult(null);
    try {
      const res = await fetch(`/api/complaints/track/${trackingId.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Tracking failed');
      setTrackingResult(data);
    } catch (err) { setTrackingError(err.message); } finally { setTrackingBusy(false); }
  };

  const inp = {
    width: '100%', boxSizing: 'border-box', padding: '11px 14px',
    borderRadius: 8, border: '1px solid #ccd8cd', marginTop: 5,
    fontSize: '15px', background: '#fcfdfc', color: '#102613', outline: 'none',
    fontFamily: 'inherit',
  };
  const btn = {
    width: '100%', padding: '12px 24px', background: '#2d6a4f', color: '#fff',
    border: 'none', borderRadius: 8, fontWeight: '600', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, fontSize: '15px', fontFamily: 'inherit',
  };
  const label = { fontSize: 14, fontWeight: '600', color: '#2c3e2e', display: 'block' };

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>

      {/* ── TOP HERO HEADER ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: '#102613',
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        borderBottom: '2px solid #2d6a4f',
      }}>
        <Droplets color="#4ade80" size={32} />
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ margin: 0, fontSize: 22, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.2 }}>AquaWatcher</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#86efac', letterSpacing: '0.5px' }}>Municipal Water Quality Monitoring Portal</p>
        </div>
      </header>

      {/* ── MAIN TWO-COLUMN LAYOUT ── */}
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '48px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 32, alignItems: 'start',
      }}>

        {/* ── LEFT: AUTH CARD ── */}
        <div className="hover-card" style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #ccd8cd',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          padding: '36px 32px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Droplets color="#2d6a4f" size={44} />
            <h2 style={{ fontSize: 26, margin: '10px 0 4px', color: '#102613', letterSpacing: '-0.4px', fontWeight: 700 }}>
              {mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Sign In'}
            </h2>
            <p style={{ color: '#556b56', fontSize: 14 }}>
              {mode === 'register'
                ? 'Register using your Aadhaar-linked mobile number.'
                : mode === 'forgot'
                ? 'Verify your email and Aadhaar-linked mobile number.'
                : 'Water quality monitoring and issue logging portal.'}
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            {mode === 'register' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <input 
                  type="checkbox" 
                  id="tenantCheckbox" 
                  checked={isTenant} 
                  onChange={(e) => {
                    setIsTenant(e.target.checked);
                    setMessage('');
                  }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="tenantCheckbox" style={{ fontSize: 14, fontWeight: '600', color: '#2c3e2e', cursor: 'pointer' }}>
                  Register as Tenant / Rental Resident
                </label>
              </div>
            )}

            {mode === 'forgot' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={label}>Aadhaar-linked mobile number</label>
                <input style={inp} value={phone} maxLength="10" placeholder="10-digit mobile number"
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} required />
              </div>
            )}

            {mode === 'register' && !isTenant && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={label}>Aadhaar-linked mobile number</label>
                  <input style={inp} value={phone} maxLength="10" placeholder="10-digit mobile number"
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setResident(null); }} required />
                </div>
                <button type="button" onClick={verify} disabled={busy || phone.length !== 10}
                  className="hover-button"
                  style={{ ...btn, background: '#4a7c59' }}>
                  {busy ? 'Checking...' : 'Verify Mobile Number'}
                </button>
                {resident && <div style={{
                  background: '#e8efe9', border: '1px solid #ccd8cd',
                  padding: '12px 14px', borderRadius: 8, color: '#2c3e2e', fontSize: 14,
                }}>
                  <ShieldCheck size={16} style={{ color: '#2d6a4f', marginRight: 6, verticalAlign: 'middle' }} />
                  <strong>Verified:</strong> {resident.name} · {resident.ward}
                </div>}
              </>
            )}

            {mode === 'register' && isTenant && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={label}>Full Name</label>
                  <input style={inp} value={tenantName} onChange={(e) => setTenantName(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={label}>Aadhaar Number (12 digits)</label>
                  <input style={inp} value={tenantAadhaar} maxLength="12" placeholder="12-digit Aadhaar number"
                    onChange={(e) => setTenantAadhaar(e.target.value.replace(/\D/g, ''))} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={label}>Mobile Number</label>
                  <input style={inp} value={tenantPhone} maxLength="10" placeholder="10-digit mobile number"
                    onChange={(e) => setTenantPhone(e.target.value.replace(/\D/g, ''))} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={label}>Original / Permanent Address</label>
                  <input style={inp} value={tenantOriginalAddress} onChange={(e) => setTenantOriginalAddress(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={label}>Current Ward Location</label>
                  <select style={inp} value={tenantWard} onChange={(e) => setTenantWard(e.target.value)} required>
                    <option value="Ward 1 - Gandhi Nagar">Ward 1 - Gandhi Nagar</option>
                    <option value="Ward 2 - Shanti Nagar">Ward 2 - Shanti Nagar</option>
                    <option value="Ward 3 - Lake View">Ward 3 - Lake View</option>
                    <option value="Ward 4 - Green Park">Ward 4 - Green Park</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={label}>Rental Agreement / Registration Copy (Max 2 MB)</label>
                  <input type="file" accept="image/*" onChange={handleRentalCopyChange} style={{ marginTop: 5 }} required />
                  {tenantRentalCopy && (
                    <img src={tenantRentalCopy} alt="Rental Agreement Copy Preview" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 8, marginTop: 8, border: '1px solid #ccd8cd' }} />
                  )}
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={label}>Email address</label>
              <input style={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={label}>{mode === 'forgot' ? 'New password' : 'Password'}</label>
              <input style={inp} type="password" value={password} minLength="6"
                onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {message && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>{message}</div>}

            <button type="submit" disabled={busy} className="hover-button" style={{ ...btn, marginTop: 4 }}>
              {mode === 'register' ? <><UserPlus size={16} /> Complete Registration</> : mode === 'forgot' ? 'Reset Password' : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: '#556b56' }}>
            {mode === 'register' ? 'Already registered?' : mode === 'forgot' ? 'Remembered password?' : 'New resident?'}&nbsp;
            <button onClick={() => { 
              setMode(mode === 'register' ? 'login' : mode === 'forgot' ? 'login' : 'register'); 
              setMessage(''); 
              setResident(null); 
              setIsTenant(false);
              setTenantName('');
              setTenantAadhaar('');
              setTenantPhone('');
              setTenantOriginalAddress('');
              setTenantRentalCopy('');
            }}
              style={{ background: 'none', border: 'none', color: '#2d6a4f', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 14 }}>
              {mode === 'register' || mode === 'forgot' ? 'Sign In' : 'Register'}
            </button>
            {mode === 'login' && <>&nbsp;·&nbsp;
              <button onClick={() => { 
                setMode('forgot'); 
                setMessage(''); 
                setResident(null); 
                setIsTenant(false);
                setTenantName('');
                setTenantAadhaar('');
                setTenantPhone('');
                setTenantOriginalAddress('');
                setTenantRentalCopy('');
              }}
                style={{ background: 'none', border: 'none', color: '#2d6a4f', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 14 }}>
                Forgot Password?
              </button>
            </>}
          </p>

          {mode === 'login' && <div style={{
            marginTop: 20, padding: '12px 14px', background: '#e8efe9',
            border: '1px solid #ccd8cd', borderRadius: 8, fontSize: 13, color: '#2c3e2e',
            wordBreak: 'break-word'
          }}>
            <strong>Assistant Executive Engineer login demo:</strong><br />
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              <code style={{ background: '#fff', padding: '2px 5px', borderRadius: 4, fontSize: '12px' }}>aee.ward1@aquawatcher.org</code> 
              <span style={{ color: '#556b56' }}>/</span> 
              <code style={{ background: '#fff', padding: '2px 5px', borderRadius: 4, fontSize: '12px' }}>engineer123</code>
            </div>
          </div>}
        </div>

        {/* ── RIGHT: TRACKING CARD ── */}
        <div className="hover-card" style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #ccd8cd',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          padding: '36px 32px',
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Search size={22} color="#2d6a4f" />
              <h2 style={{ margin: 0, fontSize: 22, color: '#102613', fontWeight: 700 }}>Track Your Complaint</h2>
            </div>
            <p style={{ color: '#556b56', fontSize: 14 }}>
              Anyone can track a complaint's status using its unique Transaction ID — no login required.
            </p>
          </div>

          <form onSubmit={track} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              style={{ ...inp, marginTop: 0, flex: '1 1 200px' }}
              value={trackingId}
              placeholder="Enter Transaction ID (e.g. AQW-123456)"
              onChange={(e) => setTrackingId(e.target.value)}
              required
            />
            <button type="submit" disabled={trackingBusy} className="hover-button" style={{
              ...btn, width: 'auto', padding: '11px 22px', flex: '0 0 auto',
            }}>
              {trackingBusy ? 'Searching...' : 'Track'}
            </button>
          </form>

          {trackingError && <div style={{
            background: '#fee2e2', color: '#991b1b', padding: '10px 14px',
            borderRadius: 8, marginTop: 14, fontSize: 14,
          }}>{trackingError}</div>}

          {trackingResult && (
            <div style={{
              background: '#fbfcfb', border: '1px solid #ccd8cd',
              borderRadius: 12, padding: 18, marginTop: 16, fontSize: 14,
            }}>
              <h3 style={{ margin: '0 0 10px', color: '#102613', fontSize: 17, fontWeight: 700 }}>{trackingResult.waterSourceName}</h3>
              <p style={{ margin: '5px 0' }}><strong>Status:</strong>{' '}
                <span style={{ fontWeight: 700, color: trackingResult.status === 'Resolved' ? '#2d6a4f' : '#b45309' }}>{trackingResult.status}</span>
              </p>
              <p style={{ margin: '5px 0' }}><strong>Assigned AEE:</strong> {trackingResult.assignedEngineerName}</p>
              <p style={{ margin: '5px 0' }}><strong>Ward:</strong> {trackingResult.ward}</p>
              <p style={{ margin: '5px 0' }}><strong>Test Results:</strong> {trackingResult.testResults || `pH: ${trackingResult.pH}, TDS: ${trackingResult.tds} ppm`}</p>
              <p style={{ margin: '5px 0' }}><strong>Description:</strong> {trackingResult.description}</p>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#556b56' }}>Filed: {new Date(trackingResult.createdAt).toLocaleString()}</p>

              {trackingResult.testReportImage && <div style={{ marginTop: 14 }}>
                <strong>Test Report Image:</strong><br />
                <img src={trackingResult.testReportImage} alt="Report" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, border: '1px solid #ccd8cd', marginTop: 6 }} />
              </div>}

              {trackingResult.resolvedImage && <div style={{
                marginTop: 14, padding: 14, background: '#e8efe9',
                borderRadius: 8, border: '1px solid #ccd8cd',
              }}>
                <strong style={{ color: '#2d6a4f' }}>Resolution Proof:</strong><br />
                <img src={trackingResult.resolvedImage} alt="Resolved" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, border: '1px solid #ccd8cd', marginTop: 8 }} />
                {trackingResult.engineerRemarks && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#2c3e2e' }}><strong>Remarks:</strong> {trackingResult.engineerRemarks}</p>}
              </div>}
            </div>
          )}
        </div>
      </div>

      {/* ── HOW IT WORKS SECTION ── */}
      <section style={{
        background: 'rgba(16, 38, 19, 0.88)',
        backdropFilter: 'blur(6px)',
        margin: '0',
        padding: '52px 20px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{
            color: '#fff', fontSize: 26, fontWeight: 700,
            margin: '0 0 36px', letterSpacing: '-0.3px',
          }}>How AquaWatcher Works</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
          }}>
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(74, 124, 89, 0.4)',
                borderRadius: 12, padding: '24px 22px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#2d6a4f', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>{step}</span>
                  <h3 style={{ margin: 0, color: '#86efac', fontSize: 16, fontWeight: 700 }}>{title}</h3>
                </div>
                <p style={{ margin: 0, color: '#b6c9b8', fontSize: 14, lineHeight: '1.65' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: 'rgba(8, 20, 10, 0.92)',
        backdropFilter: 'blur(4px)',
        padding: '40px 20px',
        textAlign: 'center',
        borderTop: '1px solid rgba(45,106,79,0.4)',
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
