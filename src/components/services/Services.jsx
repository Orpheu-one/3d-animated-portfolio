import ComputerModelContainer from "./computer/ComputerModelContainer";
import "./services.css";

const items = [
  {
    id: 1,
    title: "Service 1",
    description: "Description of Service 1",
    img: "/service1.png",
    link: "https://example.com/service1",
    color: "#ce60f3",
  },
  {
    id: 2,
    title: "Service 2",
    description: "Description of Service 1",
    img: "/service2.png",
    link: "https://example.com/service2",
    color: "#1d5d05",
  },
  {
    id: 3,
    title: "Service 3",
    description: "Description of Service 1",
    img: "/service3.png",
    link: "https://example.com/service3",
    color: "#f4aa0a",
  },
];

const Services = () => {
  return (
    <div className="services">
      <div className="sSection left">
        <h1 className="sTitle">How can I help?</h1>

        <div className="sLeftC">
          {items.map((item) => (
            <div key={item.id} className="serviceItem">
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
            </div>
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
    </div>
  );
};

export default Services;
