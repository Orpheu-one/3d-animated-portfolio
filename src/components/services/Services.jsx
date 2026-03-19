import { motion } from "framer-motion";
import ComputerModelContainer from "./computer/ComputerModelContainer";
import "./services.css";

const items = [
  { id: 1, title: "Service 1", description: "Description of Service 1", img: "/service1.png", link: "https://example.com/service1", color: "#ce60f3" },
  { id: 2, title: "Service 2", description: "Description of Service 1", img: "/service2.png", link: "https://example.com/service2", color: "#1d5d05" },
  { id: 3, title: "Service 3", description: "Description of Service 1", img: "/service3.png", link: "https://example.com/service3", color: "#f4aa0a" },
];

const fromLeft = (delay, duration = 0.8) => ({
  hidden: { x: -80, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { delay, duration, ease: "easeInOut" },
  },
});

const Services = () => {
  return (
    <motion.div
      className="services"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.2 }}
    >
      <div className="sSection left">
        <motion.h1 className="sTitle" variants={fromLeft(0, 1.0)}>
          How can I help?
        </motion.h1>

        <div className="sLeftC">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className="serviceItem"
              variants={fromLeft(1.2 + index * 0.8)}
              
              // --- Hover: Ida e Volta controladas aqui ---
              whileHover={{
                x: 12,
                boxShadow: "4px 4px 20px rgba(21, 237, 122, 0.25)",
                borderColor: "#15ed7a",
              }}
              
              // Esta transition aplicada aqui controla o estado de "repouso" (o retorno)
              // e substitui o comportamento lento do viewport/initial
              transition={{ 
                type: "tween", 
                ease: "easeOut", 
                duration: 0.2 
              }}
              
              style={{ cursor: "pointer" }}
            >
              <a href={item.link} className="serviceLink">
                <div
                  className="imgContainer"
                  style={{
                    backgroundColor: item.color,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <img src={item.img} alt={item.title} className="serviceImg" />
                </div>

                <div className="sTextContainer">
                  <h2 className="serviceTitle">{item.title}</h2>
                  <h3 className="serviceDescription">{item.description}</h3>
                </div>
              </a>
            </motion.div>
          ))}

          <div className="counters">
            <div className="counter_1">+100</div>
            <div className="counter_2">+200</div>
          </div>
        </div>
      </div>

      <div className="sSection right">
        <ComputerModelContainer />
      </div>
    </motion.div>
  );
};

export default Services;