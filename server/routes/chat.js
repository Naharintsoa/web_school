/**
 * Route chatbot — IA scolaire basée sur Ollama
 * POST /api/chat
 *
 * Ollama exécute un modèle LLM local qui interroge la BDD en langage naturel.
 * Outils disponibles :
 *  - chercher_eleves       : recherche par nom / classe / année
 *  - notes_eleve           : notes d'un élève (tous trimestres ou un seul)
 *  - statistiques_classe   : moyenne + palmarès d'une classe
 *  - compter_eleves        : effectifs par classe / cycle / année
 *  - infos_eleve           : fiche complète (parents, adresse, ISS…)
 */
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const OLLAMA_URL     = process.env.OLLAMA_URL     || 'http://localhost:11434';
const OLLAMA_MODEL   = process.env.OLLAMA_MODEL   || 'mistral';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const OLLAMA_TIMEOUT_MS  = parseInt(process.env.OLLAMA_TIMEOUT_MS  || '60000', 10); // 60 s par tentative
const OLLAMA_MAX_RETRIES = parseInt(process.env.OLLAMA_MAX_RETRIES || '3',     10); // 3 tentatives max

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Définition des outils JSON ───────────────────────────────────────────────

const TOOLS_DEFINITIONS = `
Outils disponibles (s'il te plaît utilise JSON pour les appels) :

1. chercher_eleves : {"action": "chercher_eleves", "nom": "...", "classe": "...", "annee": "..."}
2. notes_eleve : {"action": "notes_eleve", "eleve_id": "...", "trimestre": 1}
3. statistiques_classe : {"action": "statistiques_classe", "classe": "...", "trimestre": 1, "annee": "..."}
4. compter_eleves : {"action": "compter_eleves", "classe": "...", "annee": "..."}
5. infos_eleve : {"action": "infos_eleve", "eleve_id": "..."}
`;

// ─── Exécution des outils ─────────────────────────────────────────────────────

async function executeTool(name, input) {
  switch (name) {

    case 'chercher_eleves': {
      const conditions = [];
      const params = [];
      let idx = 1;
      if (input.nom) {
        conditions.push(`(LOWER(first_name) LIKE $${idx} OR LOWER(last_name) LIKE $${idx})`);
        params.push(`%${input.nom.toLowerCase()}%`);
        idx++;
      }
      if (input.classe) {
        conditions.push(`grade = $${idx}`);
        params.push(input.classe.toUpperCase());
        idx++;
      }
      if (input.annee) {
        conditions.push(`school_year = $${idx}`);
        params.push(input.annee);
        idx++;
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = Math.min(input.limite || 20, 50);
      const { rows } = await pool.query(
        `SELECT id, first_name, last_name, grade, school_year, matricule, gender
         FROM students ${where} ORDER BY last_name, first_name LIMIT $${idx}`,
        [...params, limit]
      );
      return rows.map(r => ({
        id: r.id,
        nom: `${r.first_name} ${r.last_name}`,
        classe: r.grade,
        annee: r.school_year,
        matricule: r.matricule,
        sexe: r.gender,
      }));
    }

    case 'notes_eleve': {
      const params = [input.eleve_id];
      let where = 'student_id = $1';
      if (input.trimestre) {
        where += ' AND term = $2';
        params.push(input.trimestre);
      }
      const { rows: gradeRows } = await pool.query(
        `SELECT subject_name, term, score, coefficient, comments FROM grades WHERE ${where} ORDER BY term, subject_name`,
        params
      );
      const { rows: studentRows } = await pool.query(
        'SELECT first_name, last_name, grade FROM students WHERE id = $1',
        [input.eleve_id]
      );
      const student = studentRows[0];
      if (!student) return { erreur: 'Élève introuvable' };

      // Calcul moyenne par trimestre
      const byTerm = {};
      for (const g of gradeRows) {
        if (!byTerm[g.term]) byTerm[g.term] = [];
        byTerm[g.term].push(g);
      }
      const moyennes = {};
      for (const [t, gs] of Object.entries(byTerm)) {
        const noted = gs.filter(g => g.score !== null);
        if (noted.length) {
          const sw = noted.reduce((s, g) => s + g.score * g.coefficient, 0);
          const sc = noted.reduce((s, g) => s + g.coefficient, 0);
          moyennes[`T${t}`] = (sw / sc).toFixed(2);
        }
      }
      return {
        eleve: `${student.first_name} ${student.last_name}`,
        classe: student.grade,
        notes: gradeRows.map(g => ({
          matiere: g.subject_name,
          trimestre: g.term,
          note: g.score !== null ? Number(g.score) : 'non noté',
          coef: g.coefficient,
          appreciation: g.comments || '',
        })),
        moyennes_par_trimestre: moyennes,
      };
    }

    case 'statistiques_classe': {
      const params = [input.classe.toUpperCase(), input.trimestre];
      const yearClause = input.annee ? 'AND s.school_year = $3' : '';
      if (input.annee) params.push(input.annee);

      const { rows } = await pool.query(
        `SELECT s.id, s.first_name, s.last_name,
                SUM(g.score * g.coefficient) / NULLIF(SUM(g.coefficient), 0) AS moyenne
         FROM students s
         JOIN grades g ON g.student_id = s.id
         WHERE s.grade = $1 AND g.term = $2 ${yearClause}
           AND g.score IS NOT NULL
         GROUP BY s.id, s.first_name, s.last_name
         ORDER BY moyenne DESC NULLS LAST`,
        params
      );
      if (!rows.length) return { message: 'Aucune note trouvée pour cette classe/trimestre.' };

      const moyennes = rows.map(r => parseFloat(r.moyenne));
      const total = moyennes.reduce((a, b) => a + b, 0);
      return {
        classe: input.classe,
        trimestre: input.trimestre,
        nb_eleves: rows.length,
        moyenne_classe: (total / rows.length).toFixed(2),
        meilleur: { nom: `${rows[0].first_name} ${rows[0].last_name}`, moyenne: parseFloat(rows[0].moyenne).toFixed(2) },
        moins_bon: { nom: `${rows.at(-1).first_name} ${rows.at(-1).last_name}`, moyenne: parseFloat(rows.at(-1).moyenne).toFixed(2) },
        palmares: rows.slice(0, 5).map((r, i) => ({
          rang: i + 1,
          nom: `${r.first_name} ${r.last_name}`,
          moyenne: parseFloat(r.moyenne).toFixed(2),
        })),
      };
    }

    case 'compter_eleves': {
      const conditions = ['1=1'];
      const params = [];
      let idx = 1;
      if (input.classe) { conditions.push(`grade = $${idx++}`); params.push(input.classe.toUpperCase()); }
      if (input.annee)  { conditions.push(`school_year = $${idx++}`); params.push(input.annee); }
      const { rows } = await pool.query(
        `SELECT grade, COUNT(*) AS nb FROM students WHERE ${conditions.join(' AND ')} GROUP BY grade ORDER BY grade`,
        params
      );
      const total = rows.reduce((s, r) => s + parseInt(r.nb), 0);
      return { total, par_classe: rows.map(r => ({ classe: r.grade, nb: parseInt(r.nb) })) };
    }

    case 'infos_eleve': {
      const { rows } = await pool.query(
        `SELECT first_name, last_name, date_of_birth, gender, grade, school_year,
                matricule, iss_number, enrollment_date,
                parent_info, address, nationality, birth_city, birth_country
         FROM students WHERE id = $1`,
        [input.eleve_id]
      );
      if (!rows.length) return { erreur: 'Élève introuvable' };
      const r = rows[0];
      const pi = r.parent_info || {};
      return {
        nom: `${r.first_name} ${r.last_name}`,
        naissance: r.date_of_birth,
        sexe: r.gender,
        classe: r.grade,
        annee: r.school_year,
        matricule: r.matricule,
        iss: r.iss_number,
        nationalite: r.nationality,
        ville_naissance: r.birth_city,
        pays_naissance: r.birth_country,
        adresse: r.address || pi.address,
        pere: { nom: pi.fatherName, tel: pi.fatherPhone, email: pi.fatherEmail, profession: pi.fatherOccupation },
        mere: { nom: pi.motherName, tel: pi.motherPhone, email: pi.motherEmail, profession: pi.motherOccupation },
      };
    }

    default:
      return { erreur: `Outil inconnu : ${name}` };
  }
}

// ─── Prompt système ───────────────────────────────────────────────────────────

const SYSTEM = `Tu es l'assistant intelligent du Collège Sully, une école primaire et collège à Madagascar.
Tu aides les enseignants, le personnel administratif et la direction à obtenir des informations sur les élèves, les notes et les classes.

Règles :
- Réponds toujours en français, de façon concise et professionnelle.
- Utilise les outils disponibles pour interroger la base de données en temps réel.
- Si une question ne concerne pas l'école, réponds poliment que tu es spécialisé dans la gestion scolaire.
- Ne divulgue jamais d'informations confidentielles à des personnes non autorisées.
- Quand tu listes des élèves ou des notes, utilise des tableaux ou des listes claires.
- Les classes disponibles sont : PS, MS, GS (maternelle), CP, CE1, CE2, CM1, CM2 (primaire), 6EME, 5EME, 4EME, 3EME (collège).
- L'année scolaire courante est indiquée dans chaque message utilisateur.

${TOOLS_DEFINITIONS}

IMPORTANT: Quand tu dois interroger la base de données, réponds en incluant les appels d'outils au format JSON
Entre tes appels d'outils dans <tool_call> et </tool_call>, puis attends les résultats et fournis une réponse finale.`;

// ─── Appel Ollama (une seule tentative) ──────────────────────────────────────

async function callOllamaOnce(messages, systemPrompt, signal) {
  const headers = { 'Content-Type': 'application/json' };
  if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`;

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      options: { temperature: 0.3 },
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    const err = new Error(`Ollama HTTP ${response.status}: ${text}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.message?.content || '';
}

// ─── Appel Ollama avec retry + timeout ────────────────────────────────────────

async function callOllama(messages, systemPrompt) {
  let lastErr;

  for (let attempt = 1; attempt <= OLLAMA_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('timeout')), OLLAMA_TIMEOUT_MS);

    try {
      const text = await callOllamaOnce(messages, systemPrompt, controller.signal);
      clearTimeout(timer);
      return text;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;

      // Ne pas réessayer sur les erreurs 4xx (mauvaise requête, modèle introuvable…)
      const is4xx = err.status && err.status >= 400 && err.status < 500;
      if (is4xx) break;

      // Ne pas réessayer si c'est le dernier essai
      if (attempt === OLLAMA_MAX_RETRIES) break;

      const delay = attempt * 2000; // 2 s, 4 s, …
      const reason = err.name === 'AbortError' ? `timeout (${OLLAMA_TIMEOUT_MS / 1000} s)` : err.message;
      console.warn(`[Ollama] tentative ${attempt}/${OLLAMA_MAX_RETRIES} échouée (${reason}). Nouvel essai dans ${delay / 1000} s…`);
      await sleep(delay);
    }
  }

  const reason = lastErr?.name === 'AbortError'
    ? `délai dépassé (${OLLAMA_TIMEOUT_MS / 1000} s)`
    : lastErr?.message || 'erreur inconnue';
  throw new Error(`Ollama indisponible après ${OLLAMA_MAX_RETRIES} tentatives : ${reason}`);
}

// ─── Extraction d'outils du texte ──────────────────────────────────────────────

function extractToolCalls(text) {
  const toolCalls = [];
  const regex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      const json = JSON.parse(match[1].trim());
      toolCalls.push(json);
    } catch (e) {
      console.warn('Failed to parse tool call:', match[1]);
    }
  }
  return toolCalls;
}

// ─── Endpoint POST /api/chat ──────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const { messages, schoolYear } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'messages requis' });

  try {
    const systemWithYear = `${SYSTEM}\nAnnée scolaire active : ${schoolYear || 'inconnue'}.`;

    let currentMessages = [...messages];
    let finalText = '';

    // Boucle : Ollama génère du texte, on extrait les outils, on exécute, on continue
    for (let turn = 0; turn < 5; turn++) {
      const response = await callOllama(currentMessages, systemWithYear);
      finalText = response;

      const toolCalls = extractToolCalls(response);
      if (toolCalls.length === 0) {
        // Pas d'outils demandés, on a la réponse finale
        // Nettoyer les balises <tool_call> avant de renvoyer
        finalText = response.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '').trim();
        break;
      }

      // Exécuter les outils demandés
      const toolResults = await Promise.all(
        toolCalls.map(async (tool) => {
          try {
            const result = await executeTool(tool.action, tool);
            return { action: tool.action, result };
          } catch (err) {
            return { action: tool.action, error: err.message };
          }
        })
      );

      // Ajouter la réponse et les résultats au contexte
      currentMessages.push({ role: 'assistant', content: response });
      currentMessages.push({
        role: 'user',
        content: `Résultats des outils :\n${JSON.stringify(toolResults, null, 2)}\n\nMaintenant, utilise ces résultats pour répondre à la question initiale.`,
      });
    }

    res.json({ reply: finalText });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Erreur du chatbot', detail: err.message });
  }
});

export default router;
