import { useState } from "react";
import "./contacts.css";
import { motion } from "framer-motion";
import OrbitScene from './OrbitScene';

const Contacts = () => {
  const [status, setStatus] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulação de envio para validação
    const success = Math.random() > 0.5; 

    if (success) {
      setStatus("A mensagem foi enviada com sucesso!");
      e.target.reset(); // Limpa o form após sucesso
    } else {
      setStatus("Algo correu mal. Tente outra vez.");
    }
  };

  return (
    <section className="services">
      <div className="container contacts-wrapper">
        
        {/* LADO ESQUERDO: FORMULÁRIO */}
        <div className="sSection left">
          <h1 className="sTitle">Contact me</h1>
          
          <form className="sLeftC form-flex" onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="nome">Nome</label>
              <input id="nome" type="text" placeholder="O teu nome" className="form-input" required />
            </div>
            
            <div className="field-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="exemplo@email.com" className="form-input" required />
            </div>

            <div className="field-group">
              <label htmlFor="phone">Telefone</label>
              <input id="phone" type="tel" placeholder="+351 ..." className="form-input" />
            </div>

            <div className="field-group">
              <label htmlFor="mensagem">Mensagem</label>
              <textarea id="mensagem" placeholder="Como posso ajudar?" rows="5" className="form-input" required></textarea>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: "#15ed7aff", color: "#000" }}
              whileTap={{ scale: 0.98 }}
              className="send-btn"
            >
              Enviar Mensagem
            </motion.button>

            {status && (
              <p className={`form-status ${status.includes("sucesso") ? "success" : "error"}`}>
                {status}
              </p>
            )}
          </form>
        </div>

        {/* LADO DIREITO: AVATAR */}
        <div className="sSection right">
          .<div className="wrapper">
          <OrbitScene />
          </div>
          <div className="img-container-right">
             <img src="/Avatar_contacts.png" alt="Avatar" className="avatar-img" />
          </div>
        </div>

      </div>
    </section>
  );
};

export default Contacts;