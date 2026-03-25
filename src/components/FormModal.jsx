import React, { useState } from 'react';

export default function FormModal({ table, type }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleModal = () => setIsOpen(!isOpen);

  return (
    <>
      <button onClick={toggleModal} className="btn-open">
        {type === 'create' ? 'Criar' : 'Editar'} {table}
      </button>

      {isOpen && (
        <div className="modal-overlay" style={overlayStyle}>
          <div className="modal-content" style={contentStyle}>
            <h2>{type.toUpperCase()} {table}</h2>
            <hr />
            <p>Formulário em desenvolvimento para {table}...</p>
            <button onClick={toggleModal} style={{ marginTop: '10px' }}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const contentStyle = {
  background: 'white',
  padding: '20px',
  borderRadius: '8px',
  minWidth: '300px',
  color: '#333'
};