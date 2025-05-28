import { Button } from "@/components/button/Button";
import { ModelSelect } from "@/components/model/ModelSelect";
import { ChatText } from "@phosphor-icons/react";
import type { Dispatch, SetStateAction } from "react";
import { SettingsDropdown } from "../dropdown/SettingsDropdown";

type SetState<T> = Dispatch<SetStateAction<T>>;

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  stepMax: number;
  setStepMax: (value: number) => void;
  setShowSettingsMenu: (show: boolean) => void;
  setShowOIAICreator: (show: boolean) => void;
  setShowClearDialog: (show: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  onOpenSideMenu: () => void;
}

export default function Header(props: HeaderProps) {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isSettingsOpen,
    stepMax,
    setStepMax,
    setShowSettingsMenu,
    setShowOIAICreator,
    setShowClearDialog,
    setIsSettingsOpen,
    onOpenSideMenu
  } = props;
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    setIsSettingsOpen(false);
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  const handleAISettingsClick = () => {
    setIsSettingsOpen(true);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-700/50 px-4 py-2">
      <div className="flex w-full max-w-5xl mx-auto justify-between items-center gap-2">
        {/* Left side - Menu button and title */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="lg"
            className="relative w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#F48120] to-purple-500 shadow-lg 
                     hover:shadow-xl hover:shadow-[#F48120]/30 dark:hover:shadow-purple-500/30 active:scale-95
                     transition-all duration-200 ease-out"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSideMenu();
            }}
            aria-label="Abrir menú de chat"
          >
            <ChatText 
              size={20} 
              className="text-white transition-transform duration-200 ml-1 md:ml-1.5" 
              weight="duotone" 
            />
          </Button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent hidden md:block">Asistente IA</h1>
        </div>

        {/* Model Selector */}
        <div className="flex-1 max-w-xs px-1 sm:px-2">
          <div className="hidden sm:block">
            <ModelSelect />
          </div>
          <div className="sm:hidden flex items-center justify-center gap-0.5 mr-8">
            <button 
              onClick={() => setStepMax(1)}
              className={`p-1.5 rounded-lg transition-all ${stepMax === 1 ? 'bg-[#F48120]/10 scale-110' : 'bg-transparent hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50'}`}
              title="Básico"
            >
              <span className="text-sm">🎯</span>
            </button>
            <button 
              onClick={() => setStepMax(3)}
              className={`p-1.5 rounded-lg transition-all ${stepMax > 1 && stepMax <= 3 ? 'bg-blue-500/10 scale-110' : 'bg-transparent hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50'}`}
              title="Equilibrado"
            >
              <span className="text-sm">🧠</span>
            </button>
            <button 
              onClick={() => setStepMax(7)}
              className={`p-1.5 rounded-lg transition-all ${stepMax > 3 && stepMax <= 7 ? 'bg-purple-500/10 scale-110' : 'bg-transparent hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50'}`}
              title="Avanzado"
            >
              <span className="text-sm">🚀</span>
            </button>
            <button 
              onClick={() => setStepMax(10)}
              className={`p-1.5 rounded-lg transition-all ${stepMax > 7 ? 'bg-emerald-500/10 scale-110' : 'bg-transparent hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50'}`}
              title="Experto"
            >
              <span className="text-sm">🤖</span>
            </button>
          </div>
        </div>

        {/* Right side - Settings Dropdown */}
        <div className="relative">
          <SettingsDropdown
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            isSettingsOpen={isSettingsOpen}
            toggleSettings={toggleSettings}
            onAISettingsClick={handleAISettingsClick}
            stepMax={stepMax}
            setStepMax={setStepMax}
            setShowSettingsMenu={setShowSettingsMenu}
            setShowOIAICreator={setShowOIAICreator}
            setShowClearDialog={setShowClearDialog}
          />
        </div>
      </div>
    </header>
  );
}
