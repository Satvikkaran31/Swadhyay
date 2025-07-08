import { useContext } from 'react';
import { UserContext } from '../context/UserProvider.jsx';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import { useTriggerGoogleLogin } from '../utils/googleLoginHelper.jsx';

const LoginButton = ({ redirectPath = "/" }) => {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate(); // React Router hook
  const login = useTriggerGoogleLogin(setUser, redirectPath, navigate); 

  return (
    <button className="login-button" onClick={login}>
      Login
    </button>
  );
};

export default LoginButton;
