// LoginButton.jsx
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useContext } from 'react';
import { UserContext } from '../context/UserProvider.jsx';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import { useTriggerGoogleLogin } from '../utils/googleLoginHelper.jsx';
const LoginButton = ({ redirectPath = "/" }) => {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const login = useTriggerGoogleLogin(setUser,redirectPath)
  return (
    <button className="login-button" onClick={login}>
      Login
    </button>
  );
};

export default LoginButton;
