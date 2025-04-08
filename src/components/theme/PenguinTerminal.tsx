import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Command {
  input: string;
  output: string;
}

const PenguinTerminal: React.FC = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [input, setInput] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  const penguinResponses: Record<string, string> = {
    'help': 'Available commands:\n- about: Learn about me\n- skills: View my technical skills\n- projects: See my projects\n- contact: Get in touch\n- clear: Clear the terminal',
    'about': 'I\'m a data engineer with expertise in building scalable data pipelines and analytics platforms.',
    'skills': 'My skills include:\n- Data Engineering (Spark, Kafka, Airflow)\n- Cloud Services (AWS)\n- Machine Learning\n- DevOps & CI/CD',
    'projects': 'Check out my projects section to see my work!',
    'contact': 'You can reach me at:\n- LinkedIn: [Your LinkedIn]\n- Email: [Your Email]',
    'clear': '',
  };

  const handleCommand = (command: string) => {
    const normalizedCommand = command.toLowerCase().trim();
    let output = '';

    if (normalizedCommand === 'clear') {
      setCommands([]);
      return;
    }

    if (penguinResponses[normalizedCommand]) {
      output = penguinResponses[normalizedCommand];
    } else {
      output = '🐧 Hmm, I don\'t understand that command. Try "help" to see available commands.';
    }

    setCommands([...commands, { input: command, output }]);
    setInput('');
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  return (
    <div className="fixed bottom-4 right-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: isVisible ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="bg-dark-200/90 backdrop-blur-sm p-4 rounded-lg w-96"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-full mr-2">
              {/* Penguin Icon */}
              <div className="w-6 h-6 mx-1 mt-1 bg-black rounded-full" />
            </div>
            <span className="text-white font-mono">penguin-terminal</span>
          </div>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-white hover:text-data transition-colors"
          >
            {isVisible ? '×' : '>_'}
          </button>
        </div>

        {isVisible && (
          <>
            <div
              ref={terminalRef}
              className="h-64 overflow-y-auto font-mono text-sm mb-4"
            >
              <div className="text-gray-400 mb-2">
                Welcome to Penguin Terminal! Type 'help' to get started.
              </div>
              {commands.map((cmd, index) => (
                <div key={index} className="mb-2">
                  <div className="text-data">$ {cmd.input}</div>
                  <div className="text-white whitespace-pre-line">{cmd.output}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center">
              <span className="text-data mr-2">$</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCommand(input);
                  }
                }}
                className="bg-transparent text-white outline-none flex-1"
                placeholder="Type a command..."
              />
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PenguinTerminal; 