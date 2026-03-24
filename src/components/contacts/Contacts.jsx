// src/components/contacts/Contacts.jsx

import { useState } from "react";
import "./contacts.css";
import { motion } from "framer-motion";
import OrbitScene from './OrbitScene';
import FeedbackModal from './FeedbackModal';

const Contacts = () => {
  const [status, setStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Variável para armazenar o nome do utilizador (User_Name)
  const [userName, setUserName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // MODO DE TESTE: Forçamos o sucesso para ver o Modal
    const success = true; 

    if (success) {
      setStatus("Validando dados...");
      
      // Pequeno delay para sentires o clique antes do modal saltar
      setTimeout(() => {
        setStatus("A mensagem foi enviada com sucesso!");
        setIsModalOpen(true); 
        // e.target.reset(); // Comentado para não limpar o userName antes de processares
      }, 800);

    } else {
      setStatus("Algo correu mal. Tente outra vez.");
    }
  };

  return (
    <section className="services" style={{ position: "relative", zIndex: 5 }}>
      <div className="container contacts-wrapper">
        
        {/* LADO ESQUERDO: FORMULÁRIO */}
        <div className="sSection left" style={{ position: "relative", zIndex: 10 }}>
          <h1 className="sTitle">Contact me</h1>
          
          <form 
            className="sLeftC form-flex" 
            onSubmit={handleSubmit}
            style={{ pointerEvents: "auto" }} // Garante que aceita cliques
          >
            <div className="field-group">
              <label htmlFor="nome">Name</label>
              <input 
                id="nome" 
                type="text" 
                placeholder="Your name" 
                className="form-input" 
                required 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            
            <div className="field-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="exemplo@email.com" className="form-input" required />
            </div>

            <div className="field-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" type="tel" placeholder="+351 ..." className="form-input" />
            </div>

            <div className="field-group">
              <label htmlFor="mensagem">Message</label>
              <textarea id="mensagem" placeholder="How can I help?" rows="5" className="form-input" required></textarea>
            </div>

            <motion.button 
              type="submit"
              whileHover={{ scale: 1.02, backgroundColor: "#15ed7aff", color: "#000" }}
              whileTap={{ scale: 0.98 }}
              className="send-btn"
              style={{ cursor: "pointer" }}
            >
              Enviar Mensagem
            </motion.button>

            {status && (
              <p className={`form-status ${status.includes("sucesso") || status.includes("Validando") ? "success" : "error"}`}>
                {status}
              </p>
            )}
          </form>
        </div>

        {/* LADO DIREITO: AVATAR + R3F */}
        <div className="sSection right" style={{ zIndex: 1 }}>
          <div className="wrapper">
            <OrbitScene />
          </div>
          <div className="img-container-right">
             <img src="/Avatar_contacts.png" alt="Avatar" className="avatar-img" />
          </div>
        </div>

      </div>

      {/* COMPONENTE DO MODAL */}
      <FeedbackModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </section>
  );
};

export default Contacts;