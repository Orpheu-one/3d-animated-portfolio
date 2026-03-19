import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./contacts.css";

const FeedbackModal = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleFinalSubmit = () => {
    // Aqui seria a lógica de enviar para a DB
    setSubmitted(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
          >
            {!submitted ? (
              <>
                <h2 className="modal-title">Avaliação e Consentimento</h2>
                <p className="rgpd-text">
                  Os dados pessoais fornecidos pelo visitante serão utilizados única e exclusivamente para efeitos de resposta ao pedido submetido, não sendo partilhados com terceiros, salvo quando tal seja exigido por lei.
                  <br /><br />
                  Ao clicar em “Enviar”, declara que leu e compreendeu as presentes condições de tratamento de dados pessoais e consente o seu tratamento nos termos descritos, em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).
                </p>

                <div className="star-widget">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star-btn ${star <= (hover || rating) ? "active" : ""}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <div className="modal-actions">
                  <button className="send-btn modal-btn" onClick={handleFinalSubmit}>
                    Enviar e Aceitar
                  </button>
                  <button className="close-btn" onClick={onClose}>Cancelar</button>
                </div>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="success-message"
              >
                <h3>Obrigado pelo seu contacto e opinião!</h3>
                <button className="send-btn" onClick={onClose}>Fechar</button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;