import { getElementColor } from '../data/elements';

export default function MonsterDetailPanel({ monster }) {
  if (!monster) {
    return (
      <div className="detail-panel detail-panel-empty">
        <p>Selecione um monstro na lista para ver os detalhes.</p>
      </div>
    );
  }

  const drops = monster.drops || [];
  const areas = monster.areas || [];
  const corElemento = getElementColor(monster.element);

  return (
    <div className="detail-panel">
      <div className="monster-modal-header">
        <img
          src={monster.sprite || '/assets/monsters/placeholder.png'}
          alt={monster.name}
          className="monster-modal-sprite"
        />
        <div>
          <h2 style={{ color: corElemento }}>{monster.name}</h2>
          <p className="monster-modal-level">
            Nível {monster.level}{monster.isBoss ? ' · Boss' : ''}
          </p>
          <span className="monster-tag" style={{ color: corElemento, borderColor: corElemento }}>
            {monster.element || 'neutro'}
          </span>
        </div>
      </div>

      <p className="status-preview-titulo">Atributos base</p>
      <div className="status-grid monster-stats">
        <span>STR {monster.str}</span>
        <span>AGI {monster.agi}</span>
        <span>INT {monster.int}</span>
        <span>DEX {monster.dex}</span>
        <span>VIT {monster.vit}</span>
        <span>LUK {monster.luk}</span>
      </div>

      <p className="status-preview-titulo">Stats de combate</p>
      <div className="status-grid monster-stats">
        <span>HP {monster.hpMax}</span>
        <span>MP {monster.mpMax}</span>
        <span>ATK {monster.atk}</span>
        <span>ATK-M {monster.atkM}</span>
        <span>DEF {monster.defF}</span>
        <span>DEF-M {monster.defM}</span>
        <span>Precisão {monster.precisao}</span>
        <span>Esquiva {monster.esquiva}</span>
      </div>

      <p className="status-preview-titulo">Recompensas</p>
      <div className="status-grid monster-stats">
        <span>Crítico {monster.chanceCritico}%</span>
        <span>EXP {monster.expReward}</span>
        <span>Zeny {monster.zenyReward}</span>
      </div>

      {drops.length > 0 && (
        <div className="status-preview monster-lore">
          <p className="status-preview-titulo">Drops</p>
          <ul className="drop-list">
            {drops.map((d, i) => (
              <li key={i}>
                {d.itemName} <span className="drop-chance">{Math.round(d.chance * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {areas.length > 0 && (
        <div className="status-preview monster-lore">
          <p className="status-preview-titulo">Onde encontrar</p>
          <p>{areas.join(', ').replace(/_/g, ' ')}</p>
        </div>
      )}

      {monster.lore && (
        <div className="status-preview monster-lore">
          <p className="status-preview-titulo">Registro do bestiário</p>
          <p>{monster.lore}</p>
        </div>
      )}
    </div>
  );
}
