import { avaliarSenha } from '@/lib/passwordRules';
import styles from './AuthCard.module.css';

/** Lista dos critérios da senha; cada item fica verde quando é atendido. */
export default function PasswordChecklist({ senha, id }) {
  return (
    <ul className={styles.checklist} id={id} aria-live="polite">
      {avaliarSenha(senha).map((c) => (
        <li key={c.id} className={c.ok ? styles.checkOk : undefined}>
          <span aria-hidden="true">{c.ok ? '✓' : '•'}</span> {c.texto}
          <span className={styles.srOnly}>{c.ok ? ' (atendido)' : ' (pendente)'}</span>
        </li>
      ))}
    </ul>
  );
}
