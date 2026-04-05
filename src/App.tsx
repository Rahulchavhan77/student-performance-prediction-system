import React, { useState, useEffect } from 'react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [isRegistering, setIsRegistering] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [settings, setSettings] = useState({ minMarks: 40, minAttendance: 75, minAssignment: 50 });
  const [view, setView] = useState('dashboard');
  
  const [formData, setFormData] = useState({ name: '', rollNumber: '', department: '', password: '', subject: '', marks: 0, attendance: 0, assignment: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const res = await fetch('/api/data');
    const data = await res.json();
    setStudents(data.students);
    setSettings(data.settings);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, role })
    });
    const data = await res.json();
    if (data.success) setUser(data.user);
    else setError(data.message || 'Error occurred');
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/add-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formData.name, rollNumber: formData.rollNumber })
    });
    alert("Student Added Successfully");
    fetchData();
    setView('dashboard');
  };

  const addMarks = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/add-marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        rollNumber: formData.rollNumber, 
        record: { subject: formData.subject, marks: Number(formData.marks), attendance: Number(formData.attendance), assignment: Number(formData.assignment) } 
      })
    }).then(() => {
      alert("Academic Record Added");
      fetchData();
      setView('dashboard');
    });
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }).then(() => {
      alert("Settings Updated");
      setView('dashboard');
    });
  };

  const predict = (s: any) => {
    if (!s.records || s.records.length === 0) return "No Data";
    const last = s.records[s.records.length - 1];
    if (last.marks >= 60 && last.attendance >= 75) return "Advanced";
    if (last.marks >= 40 && last.marks <= 60) return "Average";
    if (last.marks < 40 || last.attendance < 75) return "Weak";
    return "Unknown";
  };

  const calculateRank = (rollNumber: string) => {
    if (students.length === 0) return 0;
    const studentAverages = students.map(s => {
      const avg = s.records.length > 0 
        ? s.records.reduce((acc: number, r: any) => acc + r.marks, 0) / s.records.length 
        : 0;
      return { rollNumber: s.rollNumber, avg };
    });
    const sorted = [...studentAverages].sort((a, b) => b.avg - a.avg);
    return sorted.findIndex(s => s.rollNumber === rollNumber) + 1;
  };

  const insights = {
    total: students.length,
    weak: students.filter(s => predict(s) === 'Weak').length,
    advanced: students.filter(s => predict(s) === 'Advanced').length
  };

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2 className="title">AI Student Performance System</h2>
          <div className="tabs">
            <button className={role === 'student' ? 'active' : ''} onClick={() => { setRole('student'); setIsRegistering(false); }}>Student Login</button>
            <button className={role === 'teacher' ? 'active' : ''} onClick={() => { setRole('teacher'); setIsRegistering(false); }}>Teacher Login</button>
          </div>
          <form onSubmit={handleAuth}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" required onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            {(role === 'student' || isRegistering) && (
              <div className="form-group">
                <label>Roll Number</label>
                <input type="text" required onChange={e => setFormData({...formData, rollNumber: e.target.value})} />
              </div>
            )}
            {isRegistering && (
              <div className="form-group">
                <label>Department</label>
                <input type="text" required onChange={e => setFormData({...formData, department: e.target.value})} />
              </div>
            )}
            <div className="form-group">
              <label>Password</label>
              <input type="password" required onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary">{isRegistering ? 'Register' : 'Sign In'}</button>
          </form>
          {role === 'student' && (
            <p className="toggle-auth" onClick={() => setIsRegistering(!isRegistering)}>
              {isRegistering ? 'Already have an account? Login' : 'New student? Register here'}
            </p>
          )}
          {role === 'teacher' && <p className="hint">Admin / admin123</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <span className="brand">AI Student System</span>
        <div className="nav-user">
          <span>{user.name} ({user.role})</span>
          <button onClick={() => setUser(null)} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="main-content">
        {view === 'dashboard' && (
          <div className="dashboard">
            {user.role === 'teacher' ? (
              <div className="insights">
                <div className="insight-card"><h3>{insights.total}</h3><p>Total Students</p></div>
                <div className="insight-card"><h3>{insights.weak}</h3><p>Weak Students</p></div>
                <div className="insight-card"><h3>{insights.advanced}</h3><p>Advanced Students</p></div>
              </div>
            ) : (
              <div className="insights">
                <div className="insight-card"><h3>#{calculateRank(user.rollNumber)}</h3><p>Class Rank</p></div>
                <div className="insight-card"><h3>{students.find(s => s.rollNumber === user.rollNumber)?.records.length || 0}</h3><p>Subjects Recorded</p></div>
              </div>
            )}

            <div className="menu-grid">
              {user.role === 'teacher' ? (
                <>
                  <div className="menu-card" onClick={() => setView('add-student')}><h3>Add Student</h3><p>Register new student</p></div>
                  <div className="menu-card" onClick={() => setView('enter-marks')}><h3>Enter Marks</h3><p>Add academic records</p></div>
                  <div className="menu-card" onClick={() => setView('view-list')}><h3>Student List</h3><p>View all students</p></div>
                  <div className="menu-card" onClick={() => setView('predict')}><h3>Predict Performance</h3><p>AI Rule-based analysis</p></div>
                  <div className="menu-card" onClick={() => setView('weak')}><h3>Weak Students</h3><p>Identify needs improvement</p></div>
                  <div className="menu-card" onClick={() => setView('settings')}><h3>Performance Standard</h3><p>Set academic benchmarks</p></div>
                </>
              ) : (
                <>
                  <div className="menu-card" onClick={() => setView('view-records')}><h3>My Academic Records</h3><p>View marks & attendance</p></div>
                  <div className="menu-card" onClick={() => setView('view-list')}><h3>My Profile</h3><p>View personal details</p></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ... existing views ... */}

        {view === 'view-records' && user.role === 'student' && (
          <div className="table-card">
            <h3>My Academic Records</h3>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Marks (%)</th>
                  <th>Attendance (%)</th>
                  <th>Assignment</th>
                </tr>
              </thead>
              <tbody>
                {students.find(s => s.rollNumber === user.rollNumber)?.records.map((r: any, i: number) => (
                  <tr key={i}>
                    <td>{r.subject}</td>
                    <td>{r.marks}%</td>
                    <td>{r.attendance}%</td>
                    <td>{r.assignment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-20">
              <p><strong>Class Rank:</strong> #{calculateRank(user.rollNumber)}</p>
            </div>
            <button onClick={() => setView('dashboard')} className="btn-secondary mt-20">Back to Dashboard</button>
          </div>
        )}

        {view === 'add-student' && (
          <div className="form-card">
            <h3>Add New Student</h3>
            <form onSubmit={addStudent}>
              <div className="form-group"><label>Name</label><input type="text" required onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="form-group"><label>Roll Number</label><input type="text" required onChange={e => setFormData({...formData, rollNumber: e.target.value})} /></div>
              <div className="btn-group">
                <button type="submit" className="btn-primary">Save Student</button>
                <button type="button" onClick={() => setView('dashboard')} className="btn-secondary">Back</button>
              </div>
            </form>
          </div>
        )}

        {view === 'enter-marks' && (
          <div className="form-card">
            <h3>Enter Academic Record</h3>
            <form onSubmit={addMarks}>
              <div className="form-group">
                <label>Select Student</label>
                <select required onChange={e => setFormData({...formData, rollNumber: e.target.value})}>
                  <option value="">-- Choose Student --</option>
                  {students.map(s => <option key={s.rollNumber} value={s.rollNumber}>{s.name} ({s.rollNumber})</option>)}
                </select>
              </div>
              <div className="form-group"><label>Subject</label><input type="text" required onChange={e => setFormData({...formData, subject: e.target.value})} /></div>
              <div className="form-group"><label>Marks (%)</label><input type="number" required onChange={e => setFormData({...formData, marks: Number(e.target.value)})} /></div>
              <div className="form-group"><label>Attendance (%)</label><input type="number" required onChange={e => setFormData({...formData, attendance: Number(e.target.value)})} /></div>
              <div className="form-group"><label>Assignment Score</label><input type="number" required onChange={e => setFormData({...formData, assignment: Number(e.target.value)})} /></div>
              <div className="btn-group">
                <button type="submit" className="btn-primary">Save Record</button>
                <button type="button" onClick={() => setView('dashboard')} className="btn-secondary">Back</button>
              </div>
            </form>
          </div>
        )}

        {view === 'view-list' && (
          <div className="table-card">
            <h3>Student Directory</h3>
            <table>
              <thead><tr><th>Name</th><th>Roll Number</th></tr></thead>
              <tbody>
                {students.filter(s => user.role === 'teacher' || s.rollNumber === user.rollNumber).map(s => (
                  <tr key={s.rollNumber}><td>{s.name}</td><td>{s.rollNumber}</td></tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setView('dashboard')} className="btn-secondary mt-20">Back to Dashboard</button>
          </div>
        )}

        {view === 'predict' && (
          <div className="table-card">
            <h3>AI Performance Prediction</h3>
            <table>
              <thead><tr><th>Name</th><th>Roll Number</th><th>AI Result</th></tr></thead>
              <tbody>
                {students.filter(s => user.role === 'teacher' || s.rollNumber === user.rollNumber).map(s => (
                  <tr key={s.rollNumber}>
                    <td>{s.name}</td>
                    <td>{s.rollNumber}</td>
                    <td><span className={`badge ${predict(s).toLowerCase()}`}>{predict(s)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setView('dashboard')} className="btn-secondary mt-20">Back to Dashboard</button>
          </div>
        )}

        {view === 'weak' && (
          <div className="table-card">
            <h3>Weak Students (Needs Attention)</h3>
            <table>
              <thead><tr><th>Name</th><th>Roll Number</th><th>Status</th></tr></thead>
              <tbody>
                {students.filter(s => predict(s) === 'Weak').map(s => (
                  <tr key={s.rollNumber}><td>{s.name}</td><td>{s.rollNumber}</td><td><span className="badge weak">Weak</span></td></tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setView('dashboard')} className="btn-secondary mt-20">Back to Dashboard</button>
          </div>
        )}

        {view === 'settings' && (
          <div className="form-card">
            <h3>Performance Standards & Benchmarks</h3>
            <form onSubmit={saveSettings}>
              <div className="form-group"><label>Passing Marks (%)</label><input type="number" value={settings.minMarks} onChange={e => setSettings({...settings, minMarks: Number(e.target.value)})} /></div>
              <div className="form-group"><label>Required Attendance (%)</label><input type="number" value={settings.minAttendance} onChange={e => setSettings({...settings, minAttendance: Number(e.target.value)})} /></div>
              <div className="form-group"><label>Min. Assignment Score</label><input type="number" value={settings.minAssignment} onChange={e => setSettings({...settings, minAssignment: Number(e.target.value)})} /></div>
              <div className="btn-group">
                <button type="submit" className="btn-primary">Save Benchmarks</button>
                <button type="button" onClick={() => setView('dashboard')} className="btn-secondary">Back</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
