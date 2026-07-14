// Smoke test do UIContext: toast e confirm renderizam e resolvem.
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { UIProvider, useUI } from '../src/contexts/UIContext';

function Consumer({ onReady }: { onReady: (ui: ReturnType<typeof useUI>) => void }) {
  const ui = useUI();
  onReady(ui);
  return <div data-testid="child">app</div>;
}

describe('UIProvider', () => {
  it('renderiza filhos e expõe toast/confirm', () => {
    let api: ReturnType<typeof useUI> | undefined;
    render(
      <UIProvider>
        <Consumer onReady={(ui) => { api = ui; }} />
      </UIProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(typeof api?.toast).toBe('function');
    expect(typeof api?.confirm).toBe('function');
  });

  it('exibe o toast com a mensagem', async () => {
    let api: ReturnType<typeof useUI> | undefined;
    render(
      <UIProvider>
        <Consumer onReady={(ui) => { api = ui; }} />
      </UIProvider>
    );
    act(() => { api!.toast('Salvo com sucesso!', 'success'); });
    await waitFor(() => {
      expect(screen.getByText('Salvo com sucesso!')).toBeInTheDocument();
    });
  });

  it('confirm abre modal e resolve true ao confirmar', async () => {
    let api: ReturnType<typeof useUI> | undefined;
    render(
      <UIProvider>
        <Consumer onReady={(ui) => { api = ui; }} />
      </UIProvider>
    );

    let result: Promise<boolean>;
    act(() => { result = api!.confirm('Excluir este item?', { confirmText: 'Excluir', danger: true }); });

    await waitFor(() => {
      expect(screen.getByText('Excluir este item?')).toBeInTheDocument();
    });

    act(() => { screen.getByText('Excluir').click(); });
    await expect(result!).resolves.toBe(true);
  });
});
