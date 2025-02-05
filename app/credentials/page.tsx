"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Building2, HashIcon, AlertCircle, Key, Clock } from "lucide-react";

interface LoginActivity {
    id: number;
    timestamp: string;
    staffId: string;
    branch: string;
    counter: string;
    success: boolean;
    details: string;
    ip_address: string;
    user_agent: string;
}

interface TouchedState {
    id: boolean;
    password: boolean;
    counter: boolean;
}

export default function CredentialsPage() {
    const router = useRouter();
    
    // State declarations
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [branch, setBranch] = useState("Main Branch"); // Set default branch
    const [counter, setCounter] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [showResetForm, setShowResetForm] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [touched, setTouched] = useState<TouchedState>({
        id: false,
        password: false,
        counter: false
    });
    const [logs, setLogs] = useState<LoginActivity[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    // Available branches
    const branches = ["Main Branch", "Branch 1", "Branch 2", "Branch 3"];

    // Input validation class helper
    const getInputValidationClass = (field: keyof TouchedState, value: string) => {
        const baseClasses = "w-full p-3 border rounded-lg pl-10 focus:outline-none focus:ring-2";
        if (!touched[field]) return `${baseClasses} border-gray-200`;
        return value
            ? `${baseClasses} border-green-500 focus:ring-green-200`
            : `${baseClasses} border-red-500 focus:ring-red-200`;
    };

    // Handle input focus
    const handleInputFocus = (field: keyof TouchedState) => {
        setTouched(prev => ({
            ...prev,
            [field]: true
        }));
    };

    // Log login activity
    const logLoginActivity = async (success: boolean, details: string) => {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/login-logs/', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                staff_id: id,
                branch,
                counter,
                success,
                details,
            }),
        });

            if (!response.ok) {
                console.error('Failed to log login activity');
            }
        } catch (error) {
            console.error('Error logging login activity:', error);
        }
    };

    // Fetch login logs
    const fetchLoginLogs = async () => {
        if (!isAdmin || id !== "admin") return;
        
        setIsLoadingLogs(true);
        try {
          const response = await fetch('http://127.0.0.1:8000/api/login-logs/');
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            } else {
                console.error('Failed to fetch login logs');
            }
        } catch (error) {
            console.error('Error fetching login logs:', error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    // Handle password reset
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        // Implement password reset logic here
    };

    // Fetch logs when activity log is shown
    useEffect(() => {
        if (showActivityLog) {
            fetchLoginLogs();
        }
    }, [showActivityLog]);

    // Handle login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setTouched({
            id: true,
            password: true,
            counter: true
        });

        if (!id || !password || !counter) {
            setError("Please fill in all required fields");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const customPassword = localStorage.getItem(`password_${id}`);
            const correctPassword = customPassword || "password123";

            if (id === "admin" && password === correctPassword) {
                setIsAdmin(true);
                
                if (rememberMe) {
                    localStorage.setItem("rememberedId", id);
                    localStorage.setItem("rememberedBranch", branch);
                    localStorage.setItem("rememberedCounter", counter);
                } else {
                    localStorage.removeItem("rememberedId");
                    localStorage.removeItem("rememberedBranch");
                    localStorage.removeItem("rememberedCounter");
                }

                localStorage.setItem("authenticated", "true");
                localStorage.setItem("userBranch", branch);
                localStorage.setItem("counterNo", counter);
                
                await logLoginActivity(true, "Successful login");
                router.push("/diamond-calculator");
            } else {
                setError("Invalid credentials. Please check your Staff ID and password.");
                await logLoginActivity(false, "Invalid credentials");
            }
        } catch (err) {
            setError("Network error. Please check your connection and try again.");
            await logLoginActivity(false, "Network error");
        } finally {
            setIsLoading(false);
        }
    };

  // Update the ActivityLog component to use the fetched logs
  const ActivityLog: React.FC = () => {
    if (!isAdmin || id !== "admin") {
      return null;
    }
  
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">Login Activity Log</h3>
            <button
              onClick={() => setShowActivityLog(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="p-4 overflow-auto max-h-[calc(80vh-8rem)]">
            {isLoadingLogs ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Staff ID</th>
                    <th className="text-left p-2">Branch</th>
                    <th className="text-left p-2">Counter</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className="p-2 text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2 text-sm">{log.staffId}</td>
                      <td className="p-2 text-sm">{log.branch}</td>
                      <td className="p-2 text-sm">{log.counter}</td>
                      <td className="p-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="p-2 text-sm">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {showResetForm ? "Reset Password" : "Welcome Back"}
          </h2>
          <p className="text-gray-600 mt-2">
            {showResetForm ? "Enter your new password" : "Please enter your credentials to continue"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {showResetForm ? (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Staff ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className={getInputValidationClass('id', id)}
                  placeholder="Enter your ID"
                />
                <LogIn className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg pl-10"
                  placeholder="Enter new password"
                />
                <Key className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg pl-10"
                  placeholder="Confirm new password"
                />
                <Key className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium transition-all duration-200"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
              <button
                type="button"
                onClick={() => setShowResetForm(false)}
                className="flex-1 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50"
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
                Staff ID
                {touched.id && !id && <span className="text-red-500 text-xs">Required</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  onFocus={() => handleInputFocus('id')}
                  className={getInputValidationClass('id', id)}
                  placeholder="Enter your ID"
                  autoComplete="username"
                />
                <LogIn className={`absolute left-3 top-3.5 h-5 w-5 ${id ? 'text-green-500' : 'text-gray-400'}`} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
                Password
                {touched.password && !password && <span className="text-red-500 text-xs">Required</span>}
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => handleInputFocus('password')}
                  className={getInputValidationClass('password', password)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Branch
              </label>
              <div className="relative">
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg pl-10 appearance-none bg-white"
                >
                  {branches.map((b, index) => (
                    <option key={index} value={b}>{b}</option>
                  ))}
                </select>
                <Building2 className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <div className="absolute right-3 top-3.5 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
                Counter No
                {touched.counter && !counter && <span className="text-red-500 text-xs">Required</span>}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={counter}
                  onChange={(e) => setCounter(e.target.value)}
                  onFocus={() => handleInputFocus('counter')}
                  className={getInputValidationClass('counter', counter)}
                  placeholder="Enter counter number"
                  min="1"
                  max="99"
                />
                <HashIcon className={`absolute left-3 top-3.5 h-5 w-5 ${counter ? 'text-green-500' : 'text-gray-400'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowResetForm(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Reset Password
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>

            {isAdmin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowActivityLog(true)}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1 mx-auto"
                >
                  <Clock className="h-4 w-4" />
                  View Login Activity
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      {showActivityLog && <ActivityLog />}
    </div>
  );
} 