import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { useState, useEffect } from 'react';
import { ParentDashboard } from './ParentDashboard';
import { TeacherDashboard } from './TeacherDashboard';
import {
  clearSession,
  fetchMe,
  getStoredToken,
  getStoredUser,
  login,
  register,
  storeSession,
  type AuthUser,
  type UserRole,
} from '../lib/auth';

export default function App() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loginEmail, setLoginEmail] = useState('teacher@doodle.test');
  const [loginPassword, setLoginPassword] = useState('Demo@123456');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('PARENT');
  const [registerError, setRegisterError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const images = [
    "https://alokiddy.com.vn/Uploads/images/15.jpg",
    "https://vnmedia2.monkeyuni.net/upload/web/storage_web/30-03-2022_08:40:53_c%C3%A1ch+d%E1%BA%A1y+t%E1%BB%AB+v%E1%BB%B1ng+ti%E1%BA%BFng+Anh+cho+h%E1%BB%8Dc+sinh+ti%E1%BB%83u+h%E1%BB%8Dc.jpg",
    "https://ila.edu.vn/wp-content/uploads/2023/03/ila-day-tre-hoc-tieng-anh-qua-hinh-anh-1.jpg",
    "https://babilala.vn/wp-content/uploads/2023/02/cac-app-hoc-tieng-anh-hay-cho-tre.jpg",
    "https://babilala.vn/wp-content/uploads/2023/02/ung-dung-hoc-tieng-anh-bang-hinh-anh-750x500.jpeg",
  ];

  function getFriendlyLoginError(error: unknown) {
    const message = error instanceof Error ? error.message : "";

    if (!message || message === "Request failed" || message.includes("Failed to fetch")) {
      return "Chưa kết nối được máy chủ. Vui lòng thử lại sau.";
    }

    if (message === "INVALID_CREDENTIALS" || message.includes("401")) {
      return "Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.";
    }

    return "Đăng nhập chưa thành công. Vui lòng kiểm tra lại thông tin và thử lại.";
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser) return;

    setCurrentUser(storedUser);
    fetchMe(token).catch(() => {
      clearSession();
      setCurrentUser(null);
    });
  }, []);

  async function handleLogin() {
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const session = await login(loginEmail, loginPassword);
      storeSession(session);
      setCurrentUser(session.user);
      setShowLoginModal(false);
    } catch (error) {
      setLoginError(getFriendlyLoginError(error));
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleRegister() {
    setRegisterError('');
    const fullName = registerFullName.trim();
    const email = registerEmail.trim();

    if (!fullName || !email || !registerPassword) {
      setRegisterError('Vui lòng nhập đầy đủ họ tên, email và mật khẩu');
      return;
    }

    if (!email.includes('@')) {
      setRegisterError('Email không hợp lệ');
      return;
    }

    if (registerPassword.length < 8) {
      setRegisterError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsRegistering(true);
    try {
      await register({
        email,
        password: registerPassword,
        full_name: fullName,
        role: registerRole,
      });
      const session = await login(email, registerPassword);
      storeSession(session);
      setCurrentUser(session.user);
      setShowRegisterModal(false);
      setRegisterFullName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      setRegisterRole('PARENT');
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Đăng ký thất bại');
    } finally {
      setIsRegistering(false);
    }
  }

  function handleLogout() {
    clearSession();
    setCurrentUser(null);
  }

  if (currentUser?.role === 'TEACHER') {
    return <TeacherDashboard user={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser?.role === 'PARENT') {
    return <ParentDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Carousel Background */}
      <div className="absolute inset-0">
        {images.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ImageWithFallback
              src={img}
              alt={`Children learning English ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/60"></div>
          </div>
        ))}
      </div>

      {/* Floating Elements - Simplified */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {/* Letter A */}
        <div className="absolute top-[10%] left-[5%] w-16 h-16 bg-gradient-to-br from-[#ffc107] to-[#e6a500] rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg animate-float-1 opacity-60">
          A
        </div>

        {/* Star */}
        <div className="absolute top-[45%] left-[3%] text-5xl animate-float-3 drop-shadow-lg opacity-50">
          ⭐
        </div>

        {/* Letter B */}
        <div className="absolute bottom-[15%] left-[8%] w-16 h-16 bg-gradient-to-br from-[#2b8cff] to-[#1a6fd4] rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg animate-float-4 opacity-60">
          B
        </div>

        {/* Letter C */}
        <div className="absolute top-[30%] right-[5%] w-16 h-16 bg-gradient-to-br from-[#0cc57d] to-[#08a869] rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg animate-float-7 opacity-60">
          C
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-8 py-6">
        {/* Headline */}
        <div className="space-y-6 mb-8 animate-slide-down">
          <h1 className="text-5xl font-bold text-white leading-tight drop-shadow-2xl max-w-5xl mx-auto">
            Every Drawing Tells a Story.<br />
            <span className="bg-gradient-to-r from-[#ffc107] via-[#ffdc57] to-[#fff5c7] bg-clip-text text-transparent">
              Every Story Teaches a Word.
            </span>
          </h1>
          <p className="text-xl text-white/95 leading-relaxed max-w-3xl mx-auto drop-shadow-lg">
            Nền tảng giúp trẻ em học tiếng Anh qua vẽ tranh, chơi game và các hoạt động tương tác thú vị
          </p>
        </div>

        {/* Features */}
        <div className="flex items-center justify-center gap-4 mb-6 animate-slide-down animation-delay-400">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30 hover:bg-white/30 transition-all">
            <span className="text-3xl">📝</span>
            <div className="text-left">
              <div className="text-sm text-white font-bold">Giao bài tập</div>
              <div className="text-xs text-white/80">Dễ dàng tạo và quản lý bài học</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30 hover:bg-white/30 transition-all">
            <span className="text-3xl">👥</span>
            <div className="text-left">
              <div className="text-sm text-white font-bold">Quản lý lớp học</div>
              <div className="text-xs text-white/80">Theo dõi học sinh hiệu quả</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30 hover:bg-white/30 transition-all">
            <span className="text-3xl">🎨</span>
            <div className="text-left">
              <div className="text-sm text-white font-bold">Học tập tương tác</div>
              <div className="text-xs text-white/80">Vẽ, luyện nói và nhận thưởng</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30 hover:bg-white/30 transition-all">
            <span className="text-3xl">🤝</span>
            <div className="text-left">
              <div className="text-sm text-white font-bold">Kết nối phụ huynh</div>
              <div className="text-xs text-white/80">Đồng hành cùng sự tiến bộ của trẻ</div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4 mb-6 animate-slide-down animation-delay-600">
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-8 py-3 bg-white/20 backdrop-blur-md border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-[#2b8cff] transition-all hover:scale-105 shadow-xl"
          >
            Đăng nhập
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-8 py-3 bg-gradient-to-r from-[#ffc107] to-[#e6a500] text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all shadow-xl"
          >
            Đăng ký miễn phí →
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 animate-fade-in animation-delay-800">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">10,000+</div>
            <div className="text-sm text-white/80">Học sinh</div>
          </div>
          <div className="w-px h-10 bg-white/30"></div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">500+</div>
            <div className="text-sm text-white/80">Giáo viên</div>
          </div>
          <div className="w-px h-10 bg-white/30"></div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">1,000+</div>
            <div className="text-sm text-white/80">Bài học</div>
          </div>
          <div className="w-px h-10 bg-white/30"></div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">98%</div>
            <div className="text-sm text-white/80">Hài lòng</div>
          </div>
        </div>
      </div>

      {/* Carousel Dots */}
      <div className="absolute bottom-4 left-4 flex gap-2 z-30">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentImageIndex
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative animate-scale-in">
            {/* Close Button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-[#f5f6f8] hover:bg-[#e8eaed] rounded-full flex items-center justify-center transition-all"
            >
              <svg className="w-5 h-5 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#1f2937] mb-2">Đăng nhập</h2>
              <p className="text-sm text-[#6b7280]">Chào mừng bạn trở lại</p>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(event) => {
                  setLoginEmail(event.target.value);
                  setLoginError('');
                }}
                className="w-full px-4 py-3 bg-[#f5f6f8] border-2 border-transparent rounded-xl text-base focus:outline-none focus:border-[#2b8cff] focus:bg-white transition-all"
              />

              <input
                type="password"
                placeholder="Mật khẩu"
                value={loginPassword}
                onChange={(event) => {
                  setLoginPassword(event.target.value);
                  setLoginError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleLogin();
                  }
                }}
                className="w-full px-4 py-3 bg-[#f5f6f8] border-2 border-transparent rounded-xl text-base focus:outline-none focus:border-[#2b8cff] focus:bg-white transition-all"
              />

              {loginError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {loginError}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full py-3 bg-gradient-to-r from-[#2b8cff] to-[#1a6fd4] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>

              <div className="text-center">
                <a href="#" className="text-sm text-[#6b7280] hover:text-[#2b8cff] transition-colors">
                  Quên mật khẩu?
                </a>
              </div>
            </div>

            {/* Social Login */}
            <div className="mt-4 pt-4 border-t border-[#e8eaed]">
              <p className="text-center text-xs text-[#6b7280] mb-3">Hoặc đăng nhập với</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2 px-3 bg-white border-2 border-[#e8eaed] rounded-lg font-medium text-sm text-[#4b5563] hover:border-[#2b8cff] hover:text-[#2b8cff] transition-all flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button className="py-2 px-3 bg-white border-2 border-[#e8eaed] rounded-lg font-medium text-sm text-[#4b5563] hover:border-[#2b8cff] hover:text-[#2b8cff] transition-all flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-[#6b7280]">
              Chưa có tài khoản?{' '}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setShowRegisterModal(true);
                }}
                className="text-[#2b8cff] font-semibold hover:underline"
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-[#f5f6f8] hover:bg-[#e8eaed] rounded-full flex items-center justify-center transition-all"
            >
              <svg className="w-5 h-5 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#1f2937] mb-2">Đăng ký miễn phí</h2>
              <p className="text-sm text-[#6b7280]">Bắt đầu hành trình học tập</p>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Họ và tên"
                value={registerFullName}
                onChange={(event) => setRegisterFullName(event.target.value)}
                className="w-full px-4 py-3 bg-[#f5f6f8] border-2 border-transparent rounded-xl text-base focus:outline-none focus:border-[#ffc107] focus:bg-white transition-all"
              />

              <input
                type="email"
                placeholder="Email"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                className="w-full px-4 py-3 bg-[#f5f6f8] border-2 border-transparent rounded-xl text-base focus:outline-none focus:border-[#ffc107] focus:bg-white transition-all"
              />

              <input
                type="password"
                placeholder="Mật khẩu"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                className="w-full px-4 py-3 bg-[#f5f6f8] border-2 border-transparent rounded-xl text-base focus:outline-none focus:border-[#ffc107] focus:bg-white transition-all"
              />

              <input
                type="password"
                placeholder="Xác nhận mật khẩu"
                value={registerConfirmPassword}
                onChange={(event) => setRegisterConfirmPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleRegister();
                  }
                }}
                className="w-full px-4 py-3 bg-[#f5f6f8] border-2 border-transparent rounded-xl text-base focus:outline-none focus:border-[#ffc107] focus:bg-white transition-all"
              />

              <select
                value={registerRole}
                onChange={(event) => setRegisterRole(event.target.value as UserRole)}
                className="w-full px-4 py-3 bg-[#f5f6f8] border-2 border-transparent rounded-xl text-base focus:outline-none focus:border-[#ffc107] focus:bg-white transition-all"
              >
                <option value="PARENT">Phụ huynh</option>
                <option value="TEACHER">Giáo viên</option>
              </select>

              {registerError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {registerError}
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={isRegistering}
                className="w-full py-3 bg-gradient-to-r from-[#ffc107] to-[#e6a500] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isRegistering ? 'Đang đăng ký...' : 'Đăng ký ngay'}
              </button>
            </div>

            {/* Social Login */}
            <div className="mt-4 pt-4 border-t border-[#e8eaed]">
              <p className="text-center text-xs text-[#6b7280] mb-3">Hoặc đăng ký với</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2 px-3 bg-white border-2 border-[#e8eaed] rounded-lg font-medium text-sm text-[#4b5563] hover:border-[#ffc107] hover:text-[#ffc107] transition-all flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button className="py-2 px-3 bg-white border-2 border-[#e8eaed] rounded-lg font-medium text-sm text-[#4b5563] hover:border-[#ffc107] hover:text-[#ffc107] transition-all flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-[#6b7280]">
              Đã có tài khoản?{' '}
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  setShowLoginModal(true);
                }}
                className="text-[#ffc107] font-semibold hover:underline"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -20px) rotate(5deg); }
          50% { transform: translate(-5px, -40px) rotate(-3deg); }
          75% { transform: translate(15px, -25px) rotate(7deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-15px, 30px); }
          66% { transform: translate(10px, 15px); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(20px, -30px) rotate(180deg); }
        }
        @keyframes float-4 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-12px, 25px) rotate(-5deg); }
          50% { transform: translate(8px, 45px) rotate(4deg); }
          75% { transform: translate(-18px, 30px) rotate(-8deg); }
        }
        @keyframes float-5 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(12px, -25px); }
          66% { transform: translate(-8px, -15px); }
        }
        @keyframes float-6 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-25px, 35px) rotate(-15deg); }
        }
        @keyframes float-7 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(18px, -18px) rotate(8deg); }
          50% { transform: translate(-10px, -35px) rotate(-6deg); }
          75% { transform: translate(22px, -22px) rotate(10deg); }
        }
        @keyframes float-8 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-20px, 20px); }
          66% { transform: translate(15px, 10px); }
        }
        @keyframes float-9 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(28px, -28px) rotate(20deg); }
        }
        @keyframes float-10 {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-float-1 { animation: float-1 8s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 7s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 9s ease-in-out infinite; }
        .animate-float-4 { animation: float-4 10s ease-in-out infinite; }
        .animate-float-5 { animation: float-5 6s ease-in-out infinite; }
        .animate-float-6 { animation: float-6 8s ease-in-out infinite; }
        .animate-float-7 { animation: float-7 9s ease-in-out infinite; }
        .animate-float-8 { animation: float-8 7s ease-in-out infinite; }
        .animate-float-9 { animation: float-9 11s ease-in-out infinite; }
        .animate-float-10 { animation: float-10 3s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-slide-down { animation: slide-down 0.8s ease-out; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-800 { animation-delay: 0.8s; }
      `}</style>
    </div>
  );
}
