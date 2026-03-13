import Contacts from "./components/contacts/Contacts"
import Hero from "./components/hero/Hero"
import Portfolio from "./components/portfolio/Portfolio"
import Services from "./components/services/Services"

const App = () => {
  return (
    <div className='container'>
      <section id="welcome">
       <Hero />
      
      </section>
      <section id="services">
       <Services />
      </section>
      <section id="portfolio">
       <Portfolio />
      </section>
      <section id="contacts">
       <Contacts />
      </section>
      
      
    </div>
  )
}

export default App