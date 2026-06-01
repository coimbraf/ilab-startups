const fs = require('fs');
const code = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

const returnStatement = `
  return (
    <div className="pb-12">
      <div className="bg-white border-b border-gray-100 mb-8 pt-8 pb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-navy/5 p-3 rounded-2xl">
                <Bell className="w-6 h-6 text-navy" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-playfair text-navy">Painel de Aprovações</h1>
                <p className="text-sm text-gray-500">Revise e valide os entregáveis enviados pelos founders.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadPending()}
                disabled={isLoading}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-navy border border-gray-200 px-4 py-2 rounded-xl transition-all hover:border-gray-300"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Feedback messages */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-teal/10 border border-teal/20 text-teal font-bold px-5 py-4 rounded-xl"
            >
              {successMsg}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-6 bg-red-50 border border-red-100 text-red-600 font-bold px-5 py-4 rounded-xl"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-fox animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Carregando submissões...</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="bg-gray-50 p-6 rounded-full">
              <Inbox className="w-10 h-10 text-gray-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-graphite mb-1">Nenhuma submissão pendente</h3>
              <p className="text-sm text-gray-400">Quando os founders enviarem entregáveis, eles aparecerão aqui.</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-yellow-400 text-white text-xs font-black px-2.5 py-1 rounded-full">
                {pending.length}
              </span>
              <h2 className="font-bold text-graphite">submissão{pending.length !== 1 ? 'ões' : ''} aguardando revisão</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {pending.map(item => (
                  <React.Fragment key={item.id}>
                    <PendingCard
                      item={item}
                      onApprove={(i) => handleOpenModal(i, 'approved')}
                      onReject={(i) => handleOpenModal(i, 'rejected')}
                    />
                  </React.Fragment>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Revisão */}
      <AnimatePresence>
        {modalItem && (
          <ReviewModal
            item={modalItem}
            action={modalAction}
            onConfirm={handleConfirmReview}
            onClose={() => setModalItem(null)}
            isProcessing={isProcessing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}`;

const startIdx = code.indexOf('    } finally {\n      setIsProcessing(false);\n      setModalItem(null);\n    }\n  };\n');

if(startIdx !== -1) {
  const endIdx = code.indexOf('function OverviewManager() {');
  // Include the length of the finally block string we matched
  const matchStr = '    } finally {\n      setIsProcessing(false);\n      setModalItem(null);\n    }\n  };\n';
  const newCode = code.substring(0, startIdx + matchStr.length) + '\n' + returnStatement + '\n\n' + code.substring(endIdx);
  fs.writeFileSync('src/pages/AdminPanel.tsx', newCode);
  console.log('Fixed syntax error!');
} else {
  console.log('Could not find start index');
}
