import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const updateFormData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Password strength requirements
  const passwordRequirements = [
    { 
      label: 'Almeno 8 caratteri', 
      test: () => formData.password.length >= 8 
    },
    { 
      label: 'Almeno una lettera maiuscola', 
      test: () => /[A-Z]/.test(formData.password) 
    },
    { 
      label: 'Almeno un numero', 
      test: () => /[0-9]/.test(formData.password) 
    },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.firstName) newErrors.firstName = 'Nome richiesto';
    if (!formData.lastName) newErrors.lastName = 'Cognome richiesto';
    if (!formData.email) newErrors.email = 'Email richiesta';
    if (!formData.password) newErrors.password = 'Password richiesta';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Conferma password richiesta';
    
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }
    
    // Password validation
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'La password deve avere almeno 8 caratteri';
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = 'La password deve contenere almeno una lettera maiuscola';
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'La password deve contenere almeno un numero';
      }
    }
    
    // Password confirmation
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Le password non corrispondono';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await register(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password
      );
      
      if (success) {
        navigate('/'); // Redirect to home page on successful registration
      } else {
        setErrors({ 
          form: 'Registrazione fallita. Riprova più tardi.' 
        });
      }
    } catch (err) {
      setErrors({ 
        form: 'Si è verificato un errore. Riprova più tardi.' 
      });
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Crea il tuo account</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Hai già un account?{' '}
            <Link to="/login" className="font-medium text-primary-500 hover:text-primary-600">
              Accedi
            </Link>
          </p>
        </div>
        
        {errors.form && (
          <div className="bg-error-500/10 text-error-500 p-3 rounded-md text-sm">
            {errors.form}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="form-label">
                Nome
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                className={`form-input ${errors.firstName ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                value={formData.firstName}
                onChange={updateFormData}
              />
              {errors.firstName && (
                <p className="form-error">{errors.firstName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="lastName" className="form-label">
                Cognome
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                className={`form-input ${errors.lastName ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                value={formData.lastName}
                onChange={updateFormData}
              />
              {errors.lastName && (
                <p className="form-error">{errors.lastName}</p>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`form-input ${errors.email ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
              placeholder="esempio@email.com"
              value={formData.email}
              onChange={updateFormData}
            />
            {errors.email && (
              <p className="form-error">{errors.email}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className={`form-input pr-10 ${errors.password ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={updateFormData}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500"
                onClick={toggleShowPassword}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="form-error">{errors.password}</p>
            )}
            
            {/* Password requirements checklist */}
            {formData.password && (
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    {req.test() ? (
                      <>
                        <CheckCircle size={14} className="text-success-500" />
                        <span className="text-success-500">{req.label}</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} className="text-neutral-400" />
                        <span className="text-neutral-500">{req.label}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="form-label">
              Conferma Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className={`form-input ${errors.confirmPassword ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={updateFormData}
            />
            {errors.confirmPassword && (
              <p className="form-error">{errors.confirmPassword}</p>
            )}
          </div>
          
          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-neutral-700">
              Accetto i <a href="#" className="text-primary-500 hover:text-primary-600">Termini di servizio</a>{' '}
              e la <a href="#" className="text-primary-500 hover:text-primary-600">Privacy Policy</a>
            </label>
          </div>

          <div>
            <button
              type="submit"
              className={`btn btn-primary w-full ${isLoading ? 'btn-disabled' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                    <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrazione in corso...
                </span>
              ) : (
                'Registrati'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;