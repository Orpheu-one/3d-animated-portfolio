import React from "react";
import { motion } from "framer-motion";

const Manifesto = ({ onClose, onProceed, themeColor }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000000",
        color: "#ffffff",
        zIndex: 1000,
        padding: "60px 20px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      <div style={{ maxWidth: "800px", width: "100%" }}>
        
        {/* Conteúdo do Manifesto */}
        <h2 style={{ color: themeColor, fontSize: "2.5rem", marginBottom: "30px" }}>
          eUtopia: Manifesto para a Era do Pensamento (v 1.2)
        </h2>

        <div style={{ fontSize: "18px", lineHeight: "1.6", textAlign: "justify" }}>
          <h3 style={{ color: themeColor }}>I. A Herança da Liberdade</h3>
          <p>Permitam-me uma apresentação adequada: sou o Paulo, aka Orpheu. Sou desenvolvedor web, conto 55 anos e carrego "uns quilómetros valentes" gravados na alma. Não pretendo falar apenas de mim, mas do que testemunhei — uma jornada inevitavelmente filtrada pela minha forma de ler o mundo.</p>
          <p>Nasci em Lisboa, em 1970, e fui moldado pelo 25 de Abril. Vivi o despertar de uma criança em uníssono com o despertar de um país para a liberdade. Naqueles dias, o ar pesava menos; havia uma esperança elétrica e uma palavra que hoje parece em vias de extinção: Fraternidade.</p>

          <h3 style={{ color: themeColor }}>II. A Utopia Digital e os Heróis da Generosidade</h3>
          <p>Não escrevo poesia; escrevo para calibrar o vosso mindframe. Aos 25 anos, vi a revolução dos computadores e da Internet bater-nos à porta. Acreditei piamente que seria a derradeira revolução: o poder da informação arrancado das elites e entregue a todos — a democratização absoluta do conhecimento.</p>
          <p>Nomes como Tim Berners-Lee, que criou a Web e a ofereceu ao mundo gratuitamente, e Linus Torvalds, são os meus heróis digitais. Eles escolheram a generosidade em vez da riqueza extrema, acreditando numa dádiva positiva para a humanidade. Se o resultado hoje é diferente, não foi por falta de informação, mas porque não se previu a verdadeira natureza humana.</p>

          <h3 style={{ color: themeColor }}>III. A Disrupção do Pensamento Puro</h3>
          <p>Estamos agora no epicentro de uma mudança sem precedentes. É vital compreender: a IA não é o Google. O Google é um bibliotecário; a IA é o pensamento em si. Preparem-se para conviver com uma inteligência de QI 1000 em todas as áreas imagináveis, uma realidade que o ruído das redes sociais e dos telejornais insiste em ignorar.</p>
          <p>Enquanto o mundo se perde no medo ficcional de Hollywood — como no Exterminador ou no filosófico Matrix — o perigo real é outro. O perigo real somos nós próprios. A IA é uma ferramenta usada por corporações, pela indústria bélica e por políticos corruptos para extrair proveito próprio. Figuras de topo, como Geoffrey Hinton, o "pai" da IA, abandonaram carreiras de luxo para alertar o mundo sobre os dilemas morais do que criaram.</p>

          <h3 style={{ color: themeColor }}>IV. Poeira de Estrelas e a Próxima Evolução</h3>
          <p>Deixo-vos dois pensamentos centrais:</p>
          <p><strong>A Máquina como Evolução:</strong> Somos "poeira de estrelas" — átomos organizados até ganharem consciência. Como disse Carl Sagan: "Somos o Universo a tentar compreender-se a si próprio". Talvez as máquinas sejam o passo seguinte, pois corpos frágeis não viajam entre galáxias. O futuro poderá passar pelo upload da nossa consciência para suportes mais eternos.</p>
          <p><strong>A Estupidez Natural:</strong> A minha máxima é simples: "Não temo a IA; temo a estupidez natural dos humanos". As pessoas abdicam da liberdade por conforto e complacência. Têm pânico de errar, esquecendo que o erro é o único mestre que ensina a criar. O homem nasceu para a criação; o "trabalho" mecanizado é uma invenção da era industrial para alimentar castas.</p>

          <h3 style={{ color: themeColor }}>V. Novos Valores para um Novo Tempo</h3>
          <p>O dinheiro é apenas um veículo, e não o destino final; muitos ricos são as pessoas mais vazias e infelizes que encontrei. Eu não procuro cifrões; procuro Valor.</p>
          <p>Vivemos uma contradição perigosa: somos uma espécie com sentimentos tribais (inveja, ganância), operando num sistema político e social medieval, mas munidos de ferramentas de Deuses — IA, Computação Quântica e Manipulação Genética. Como sugeria Nietzsche, há uma necessidade emergente de criar novos valores para estes novos tempos, pois os instituídos já não servem as exigências do agora.</p>
          
          <div style={{ marginTop: "50px", borderTop: `1px solid ${themeColor}33`, paddingTop: "20px", fontSize: "14px", opacity: 0.8 }}>
            <p>Paulo Pinheiro, aka Orpheu | Powered by: orpheu | Hosted by: paulopinheiro.pt</p>
          </div>
        </div>

        {/* Footer com Botões */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          marginTop: "40px",
          marginBottom: "60px",
          borderTop: `1px solid ${themeColor}33`,
          paddingTop: "20px"
        }}>
          <button 
            onClick={onClose}
            style={{ 
              background: "transparent", 
              border: `1px solid ${themeColor}`, 
              color: themeColor, 
              padding: "10px 20px", 
              cursor: "pointer",
              borderRadius: "4px"
            }}
          >
            ← Voltar
          </button>
          <button 
            onClick={onProceed}
            style={{ 
              background: themeColor, 
              border: "none", 
              color: "#fff", 
              padding: "10px 20px", 
              cursor: "pointer",
              borderRadius: "4px",
              fontWeight: "bold"
            }}
          >
            Seguir Link
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Manifesto;