
{/* DEBUG SECTION - REMOVE BEFORE PRODUCTION */ }
<div className="fixed bottom-0 left-0 bg-black/80 text-white p-4 text-xs z-50 max-h-[30vh] overflow-auto w-full">
    <h3 className="font-bold text-yellow-400">DEBUG PRECIOS ({modeloSeleccionado?.nombre})</h3>
    <table className="w-full text-left">
        <thead>
            <tr>
                <th>Comp</th>
                <th>Marca/Mod</th>
                <th>SKU</th>
                <th>Local</th>
                <th>Remote</th>
                <th>Used</th>
            </tr>
        </thead>
        <tbody>
            {modeloSeleccionado && (() => {
                const compIds = [
                    modeloSeleccionado.componentes.procesador,
                    modeloSeleccionado.componentes.placaMadre,
                    modeloSeleccionado.componentes.ram,
                    modeloSeleccionado.componentes.almacenamiento,
                    modeloSeleccionado.componentes.gpu,
                    modeloSeleccionado.componentes.gabinete,
                    modeloSeleccionado.componentes.fuente,
                ].filter(Boolean) as string[];

                return compIds.map(id => {
                    const c = componentes.find(x => x.id === id);
                    const local = c?.precio || 0;
                    const remote = remotePrices[id];
                    const used = remote ?? local ?? 0;
                    return (
                        <tr key={id} className={!c ? 'text-red-500' : ''}>
                            <td>{c?.tipo || id}</td>
                            <td>{c ? `${c.marca} ${c.modelo}` : 'NOT FOUND'}</td>
                            <td>{c?.sku}</td>
                            <td>{local}</td>
                            <td>{remote}</td>
                            <td className="font-bold">{used}</td>
                        </tr>
                    );
                });
            })()}
            <tr>
                <td colSpan={5} className="text-right font-bold">SUMA:</td>
                <td className="font-bold text-yellow-400">
                    {modeloSeleccionado && (() => {
                        const compIds = [
                            modeloSeleccionado.componentes.procesador,
                            modeloSeleccionado.componentes.placaMadre,
                            modeloSeleccionado.componentes.ram,
                            modeloSeleccionado.componentes.almacenamiento,
                            modeloSeleccionado.componentes.gpu,
                            modeloSeleccionado.componentes.gabinete,
                            modeloSeleccionado.componentes.fuente,
                        ].filter(Boolean) as string[];
                        return compIds.reduce((sum, id) => {
                            const c = componentes.find(x => x.id === id);
                            return sum + (remotePrices[id] ?? c?.precio ?? 0);
                        }, 0);
                    })()}
                </td>
            </tr>
            <tr>
                <td colSpan={5} className="text-right font-bold">DB BASE:</td>
                <td className="font-bold text-red-400">{modeloSeleccionado?.precioBase}</td>
            </tr>
        </tbody>
    </table>
</div>
