import React from 'react';

const ErrorPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Ocorreu um erro durante o login.</h1>
        <p className="mt-4 text-lg text-gray-600">
          Tente novamente ou entre em contato com o suporte caso o erro persista.
        </p>
      </div>
    </div>
  );
};

export default ErrorPage;
