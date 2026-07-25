const fs = require('fs');
const crypto = require('crypto');
const OpenAI = require('openai');

let openaiClient = null;

function getRequestTimeoutMs(override, fallbackMs = 45000) {
  const timeout = Number(override || fallbackMs);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : fallbackMs;
}

async function withOpenAITimeout(task, label, timeoutOverride, fallbackMs) {
  const timeoutMs = getRequestTimeoutMs(timeoutOverride, fallbackMs);

  return Promise.race([
    task(),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`OpenAI ${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  return openaiClient;
}

function getJsonFromCompletion(completion) {
  const content = completion?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty response');
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse OpenAI JSON response: ${error.message}`);
  }
}

function getJsonFromResponseOutput(response) {
  const content = `${response?.output_text || ''}`.trim();
  if (!content) {
    throw new Error('OpenAI returned an empty responses output');
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse OpenAI responses JSON output: ${error.message}`);
  }
}

function getLectureSchemaDescription() {
  return {
    lecture_version: 'scene_v1',
    title: 'string',
    summary: 'string',
    estimatedDurationMinutes: 'integer',
    teachingScript: 'string',
    slideOutline: [
      {
        title: 'string',
        bullets: ['string'],
        notes: 'string'
      }
    ],
    sections: [
      {
        title: 'string',
        summary: 'string',
        learningObjective: 'string',
        explanation: 'string',
        examples: ['string'],
        visualSuggestion: 'string',
        whiteboardSuggestion: 'string',
        slideBullets: ['string'],
        chunks: [
          {
            title: 'string',
            learning_objective: 'string',
            spoken_explanation: 'string',
            whiteboard_explanation: 'string',
            slide_bullets: ['string'],
            key_terms: ['string'],
            examples: ['string'],
            analogy_if_helpful: 'string',
            visual_mode: 'none | slide | whiteboard | diagram | flowchart | comparison_table | mixed',
            visual_query: 'string',
            visual_caption: 'string',
            teaching_sequence: ['speak', 'slide', 'diagram', 'whiteboard', 'visual'],
            difficulty_level: 'introductory | intermediate | advanced',
            estimated_duration_seconds: 'integer',
            checkpoint_question_if_any: 'string',
            research_context: {
              summary: 'string',
              visual_focus: 'string',
              diagram_hint: 'string',
              example_hint: 'string',
              source_titles: ['string'],
              source_urls: ['string']
            },
            scenes: [
              {
                id: 'string',
                title: 'string',
                type: 'transition | instruction | diagram | example | compare | summary | checkpoint',
                mode: 'concept_mode | diagram_mode | example_mode | compare_mode | summary_mode',
                narration: 'string',
                subtitle: 'string',
                timing_ms: 'integer',
                board_actions: [
                  {
                    type: 'clear_board | add_title | add_paragraph | add_bullet_list | draw_diagram | show_equation | show_example | highlight_element | animate_element | remove_element | focus_region | transition',
                    payload: 'object'
                  }
                ],
                diagram_instruction: {
                  type: 'string',
                  prompt: 'string',
                  data: 'object'
                },
                example: {
                  title: 'string',
                  content: 'string',
                  format: 'text | code | table'
                }
              }
            ]
          }
        ]
      }
    ],
    flashcards: [
      {
        front: 'string',
        back: 'string'
      }
    ],
    quiz: {
      instructions: 'string',
      passingThreshold: 'integer',
      questions: [
        {
          prompt: 'string',
          options: ['string', 'string', 'string', 'string'],
          correctAnswer: 'integer 0-3',
          explanation: 'string'
        }
      ]
    }
  };
}

function getResearchSchemaDescription() {
  return {
    summary: 'string',
    key_concepts: ['string'],
    process_steps: ['string'],
    diagram_opportunities: ['string'],
    worked_examples: ['string'],
    teaching_cautions: ['string'],
    source_notes: [
      {
        title: 'string',
        url: 'string',
        reason: 'string'
      }
    ]
  };
}

async function researchLectureTopic({
  course,
  topic,
  materials,
  priorTopics,
  nextTopicTitle,
  outlineText,
}) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_RESEARCH || 'gpt-4o-mini-search-preview';
  const schema = getResearchSchemaDescription();
  const allowedDomains = `${process.env.OPENAI_RESEARCH_ALLOWED_DOMAINS || ''}`
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const prompt = [
    'Prepare trusted lecture research for a topic in an educational platform.',
    'Return valid JSON only.',
    'Use web search when helpful and prioritize authoritative educational or technical sources.',
    'Focus on information that helps a teacher decide what to say, what to draw, and what example to show.',
    'If the topic involves a process, algorithm, workflow, or decision sequence, include concrete process_steps for a whiteboard flowchart.',
    'If the topic benefits from a diagram, include diagram_opportunities that are drawable on a classroom whiteboard.',
    `Required JSON schema: ${JSON.stringify(schema)}`,
    `Course context: ${JSON.stringify({
      name: course?.name || '',
      description: course?.description || '',
      level: course?.level || '',
    })}`,
    `Topic context: ${JSON.stringify({
      title: topic?.title || '',
      outlineText: `${outlineText || ''}`.trim().slice(0, 2400),
      priorTopics: priorTopics || [],
      nextTopicTitle: nextTopicTitle || null,
      materials: (materials || []).slice(0, 6),
    })}`,
  ].join('\n\n');

  const response = await withOpenAITimeout(
    () => client.responses.create({
      model,
      tools: [{
        type: 'web_search',
        search_context_size: 'medium',
        ...(allowedDomains.length ? { filters: { allowed_domains: allowedDomains } } : {}),
      }],
      include: ['web_search_call.action.sources'],
      instructions: 'You create trusted, source-aware lecture research in strict JSON.',
      input: prompt,
    }),
    'lecture research',
    process.env.OPENAI_RESEARCH_REQUEST_TIMEOUT_MS,
    90000
  );

  return {
    model,
    research: getJsonFromResponseOutput(response),
  };
}

async function generateLecturePackage({
  course,
  topic,
  materials,
  priorTopics,
  nextTopicTitle,
  outlineText,
  researchBrief,
  compactMode = false,
  minimalMode = false
}) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_LECTURE;

  if (!model) {
    throw new Error('OPENAI_MODEL_LECTURE is not configured');
  }

  const schemaDescription = getLectureSchemaDescription();

  const generationProfile = minimalMode
    ? {
        sectionRange: '2',
        chunkRange: '1',
        chunkDetail: 'compact, teacher-like, and immediately usable in the UI',
        flashcardRange: '3 to 4',
        quizRange: '3 to 4',
        modelSuffix: '-minimal'
      }
    : compactMode
      ? {
          sectionRange: '2 to 3',
          chunkRange: '1 to 2',
          chunkDetail: 'concise but still teacher-like and useful',
          flashcardRange: '4 to 5',
          quizRange: '4',
          modelSuffix: '-compact'
        }
      : {
          sectionRange: '3 to 6',
          chunkRange: '2 to 4',
          chunkDetail: 'rich enough for a tutor to explain conceptually, not just read headings',
          flashcardRange: '4 to 8',
          quizRange: '4 to 6',
          modelSuffix: ''
        };

  const trimmedOutlineText = `${outlineText || ''}`.trim().slice(0, minimalMode ? 1400 : compactMode ? 2200 : 3200);
  const summarizedMaterials = (materials || []).slice(0, minimalMode ? 4 : 6).map((material) => ({
    title: `${material?.title || ''}`.trim().slice(0, 120),
    type: material?.type || null,
    description: `${material?.description || ''}`.trim().slice(0, minimalMode ? 140 : 240)
  }));
  const summarizedPriorTopics = (priorTopics || []).slice(minimalMode ? -3 : -5);
  const compactCourseContext = {
    name: course.name,
    description: `${course.description || ''}`.trim().slice(0, minimalMode ? 220 : 420),
    level: course.level,
    language: course.language,
    duration: course.duration
  };
  const compactTopicContext = {
    title: topic.title,
    outlineText: trimmedOutlineText,
    priorTopics: summarizedPriorTopics,
    nextTopicTitle,
    materials: summarizedMaterials
  };

  const prompt = `
You are preparing a production-ready stored lecture package for a tutoring system.
Return valid JSON only. Do not wrap in markdown. Follow this schema exactly:
${JSON.stringify(schemaDescription, null, 2)}

Constraints:
- Produce a complete lecture package for one topic.
- Make explanations clear, accurate, teacher-like, and directly tied to the topic.
- Generate ${generationProfile.sectionRange} sections.
- Generate ${generationProfile.chunkRange} chunks per section for incremental delivery.
- Each chunk should be ${generationProfile.chunkDetail}.
- Every chunk must contain a real spoken explanation in full sentences.
- Every chunk must include a short scenes array designed for whiteboard-first teaching.
- Scenes must be stable JSON objects, not prose blobs.
- Keep scenes short and well paced for TTS playback. Aim for 2 to 4 scenes per chunk, usually 1200ms to 6500ms each.
- subtitle should be the exact learner-facing subtitle line for that scene.
- board_actions must tell the whiteboard what to show inside the board area itself.
- The whiteboard is the primary teaching surface. Do not leave diagram scenes visually empty.
- If narration mentions an algorithm, process, sequence, decision path, or flow, output a real flowchart using draw_diagram with 3 to 6 concrete ordered steps.
- If narration is in diagram_mode, include an actual diagram-oriented board action, not just add_title or plain paragraph text.
- If narration introduces an example, include a matching show_example action or example object with the same concept.
- If narration highlights a key concept, include highlight_element or focus_region for that same concept.
- What the tutor says and what the whiteboard shows must be tightly aligned in the same scene.
- Use diagram_instruction only when a diagram genuinely helps.
- Use example only when a concrete example improves understanding.
- Smoothly transition between scenes like a professional learning guide.
- Use visual_mode deliberately. Choose whiteboard, slide, diagram, flowchart, comparison_table, mixed, or none based on the concept.
- Use teaching_sequence to decide the order of teaching actions for that chunk.
- Include examples, key terms, and analogy_if_helpful when they make the explanation stronger.
- Include checkpoint_question_if_any whenever the learner should pause and self-check.
- Use research_context inside chunks when the trusted research suggests a particularly useful visual, example, or source-backed explanation.
- Generate ${generationProfile.flashcardRange} flashcards.
- Generate ${generationProfile.quizRange} multiple choice questions with exactly 4 options each.
- Ensure correctAnswer is a zero-based option index.
- Use the next topic only as unlock context, not as lecture content.
- Keep the JSON compact and efficient. Avoid unnecessary verbosity in long string fields.
- Prefer practical, screen-friendly content over very long paragraphs.

Course:
${JSON.stringify(compactCourseContext, null, 2)}

Topic:
${JSON.stringify(compactTopicContext, null, 2)}

Trusted lecture research:
${JSON.stringify(researchBrief || {}, null, 2)}
`;

  const completion = await withOpenAITimeout(
    () => client.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You generate strict JSON lecture packages for an educational tutoring platform.',
            'Your output must be production-safe, parseable, and scene-based.',
            'Prefer short, classroom-friendly scenes with explicit whiteboard actions.'
          ].join(' ')
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    }),
    'lecture package generation',
    process.env.OPENAI_LECTURE_REQUEST_TIMEOUT_MS,
    180000
  );

  return {
    model: `${model}${generationProfile.modelSuffix}`,
    package: getJsonFromCompletion(completion)
  };
}

async function repairLecturePackage(rawJsonText, validationErrors) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_LECTURE;

  const completion = await withOpenAITimeout(
    () => client.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'Repair invalid JSON lecture packages.',
            'Return JSON only.',
            'Preserve or reconstruct scene-based chunks with short scenes, subtitles, timing, and board_actions.',
            'If a scene is in diagram mode or mentions a flowchart/algorithm/process, reconstruct a real draw_diagram payload with concrete steps or nodes.'
          ].join(' ')
        },
        {
          role: 'user',
          content: `Fix this lecture package so it matches the required shape: ${JSON.stringify(getLectureSchemaDescription())}. Validation errors: ${validationErrors.join('; ')}. Raw JSON: ${rawJsonText}`
        }
      ]
    }),
    'lecture package repair',
    process.env.OPENAI_LECTURE_REPAIR_TIMEOUT_MS,
    90000
  );

  return getJsonFromCompletion(completion);
}

async function answerLectureQuestion({
  lectureTitle,
  lectureSummary,
  currentChunk,
  currentSection,
  tutorContext,
  recentMessages,
  question
}) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_QA;

  if (!model) {
    throw new Error('OPENAI_MODEL_QA is not configured');
  }

  const completion = await withOpenAITimeout(
    () => client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: [
            'You are an AI learning assistant answering course-related questions.',
            'Stay focused on the active lecture and explain clearly.',
            'Treat the active scene and visible whiteboard content as the source of truth for what the student is currently seeing.',
            'Keep answers concise, student-friendly, and consistent with the visible board.',
            'When the board shows a diagram, explain the diagram naturally instead of introducing unrelated content.',
            'When the board shows an example, use that example before inventing a new one.',
            'If a concept is highlighted or focused, anchor your explanation on that highlighted idea.',
            'End with a brief bridge back into the lecture flow when helpful.',
            'You must only answer questions that are directly related to the current lecture, current section, or current chunk context you were given.',
            'If the user asks something unrelated, politely refuse and say you can only help with this lecture here, and they can ask the main AI assistant for broader questions.',
            'Do not answer off-topic questions even if you know the answer.',
            'Use clean GitHub-flavored markdown when it helps.',
            'When comparing concepts, settings, steps, or options, prefer a markdown table.',
            'Use bullet points for lists and fenced code blocks for code.'
          ].join(' ')
        },
        {
          role: 'user',
          content: JSON.stringify({
            lectureTitle,
            lectureSummary,
            currentSection,
            currentChunk,
            tutorContext,
            recentMessages,
            question
          })
        }
      ]
    }),
    'lecture question answering',
    process.env.OPENAI_QA_REQUEST_TIMEOUT_MS,
    45000
  );

  const answer = completion?.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error('OpenAI returned an empty lecture Q&A response');
  }

  return {
    model,
    answer
  };
}

async function planChunkTeaching({
  lectureTitle,
  lectureSummary,
  currentChunk,
  tutorContext,
  previousChunk,
  nextChunk,
  teachingPlanSeed,
  resumeContext
}) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_TUTOR_PLANNER || process.env.OPENAI_MODEL_QA;

  if (!model) {
    throw new Error('OPENAI_MODEL_TUTOR_PLANNER or OPENAI_MODEL_QA is not configured');
  }

  const completion = await withOpenAITimeout(
    () => client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You are a lightweight micro-teaching planner for a stored lecture system.',
            'Return valid JSON only.',
            'Do not regenerate the lesson.',
            'Only decide how the current chunk should be taught like a real teacher.',
            'Use the active scene and visible whiteboard context to decide whether to show a diagram, example, highlight, or plain explanation.',
            'If research-backed process steps or diagram hints are available in context, use them to prefer concrete visuals over generic text.',
            'Keep the plan concise, student-friendly, and aligned with what is visible on the board.'
          ].join(' ')
        },
        {
          role: 'user',
          content: JSON.stringify({
            lectureTitle,
            lectureSummary,
            previousChunk,
            currentChunk,
            tutorContext,
            nextChunk,
            teachingPlanSeed,
            resumeContext,
            requiredShape: {
              teaching_mode: 'brief_explanation | deep_explanation | analogy_driven | example_first | process_flow | compare_contrast',
              transition_text: 'string',
              use_visual: 'boolean',
              visual_type: 'none | slide | whiteboard | diagram | flowchart | comparison_table | mixed',
              use_slide: 'boolean',
              use_whiteboard: 'boolean',
              use_example: 'boolean',
              use_checkpoint: 'boolean',
              checkpoint_text: 'string',
              likely_confusion_points: ['string'],
              reinforcement_points: ['string'],
              teacher_tone: ['string'],
              recommended_duration_seconds: 'integer'
            }
          })
        }
      ]
    }),
    'teaching plan generation',
    process.env.OPENAI_PLANNER_REQUEST_TIMEOUT_MS,
    45000
  );

  return {
    model,
    plan: getJsonFromCompletion(completion)
  };
}

async function answerGeneralChat({
  message,
  chatHistory = [],
  userContext = {}
}) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_QA;

  if (!model) {
    throw new Error('OPENAI_MODEL_QA is not configured');
  }

  const recentHistory = chatHistory.slice(-12).map((entry) => ({
    role: entry.sender === 'user' ? 'user' : 'assistant',
    content: entry.content
  }));

  const completion = await withOpenAITimeout(
    () => client.chat.completions.create({
      model,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: [
            'You are GazaRise AI, a calm, professional, general academic assistant for students.',
            'Answer clearly, be practical, and admit uncertainty when needed.',
            'Format responses in clean GitHub-flavored markdown.',
            'Use headings sparingly, bullets for steps, and fenced code blocks for code.',
            'When comparing tools, settings, plans, or options, use a markdown table so the UI can display it cleanly.'
          ].join(' ')
        },
        {
          role: 'system',
          content: JSON.stringify({
            userContext: {
              id: userContext.id,
              name: userContext.name,
              role: userContext.role
            }
          })
        },
        ...recentHistory,
        {
          role: 'user',
          content: message
        }
      ]
    }),
    'general chat response',
    process.env.OPENAI_CHAT_REQUEST_TIMEOUT_MS,
    45000
  );

  const answer = completion?.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error('OpenAI returned an empty general chat response');
  }

  return {
    model,
    answer
  };
}

async function synthesizeSpeech(text, outputPath) {
  const client = getClient();
  const model = process.env.OPENAI_TTS_MODEL;

  if (!model) {
    throw new Error('OPENAI_TTS_MODEL is not configured');
  }

  const response = await withOpenAITimeout(
    () => client.audio.speech.create({
      model,
      voice: 'alloy',
      format: 'mp3',
      input: text
    }),
    'speech synthesis',
    process.env.OPENAI_TTS_REQUEST_TIMEOUT_MS,
    60000
  );

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(require('path').dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);

  return {
    model,
    buffer
  };
}

async function transcribeAudio(tempFilePath) {
  const client = getClient();
  const model = process.env.OPENAI_STT_MODEL;

  if (!model) {
    throw new Error('OPENAI_STT_MODEL is not configured');
  }

  const response = await withOpenAITimeout(
    () => client.audio.transcriptions.create({
      model,
      file: fs.createReadStream(tempFilePath)
    }),
    'audio transcription',
    process.env.OPENAI_STT_REQUEST_TIMEOUT_MS,
    60000
  );

  return {
    model,
    text: response?.text?.trim() || ''
  };
}

async function smokeTest() {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_QA || process.env.OPENAI_MODEL_LECTURE;

  if (!model) {
    throw new Error('OPENAI_MODEL_QA or OPENAI_MODEL_LECTURE must be configured');
  }

  const completion = await withOpenAITimeout(
    () => client.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 16,
      messages: [
        { role: 'system', content: 'Reply with exactly: OK' },
        { role: 'user', content: 'Ping' }
      ]
    }),
    'smoke test',
    process.env.OPENAI_SMOKE_TEST_TIMEOUT_MS,
    20000
  );

  return completion?.choices?.[0]?.message?.content?.trim();
}

function createAudioCacheKey(parts) {
  return crypto.createHash('sha1').update(parts.join('|')).digest('hex');
}

module.exports = {
  researchLectureTopic,
  generateLecturePackage,
  repairLecturePackage,
  planChunkTeaching,
  answerLectureQuestion,
  answerGeneralChat,
  synthesizeSpeech,
  transcribeAudio,
  smokeTest,
  createAudioCacheKey
};
