// AUTO-GENERATED from src/lib/stratos/{ontology,answer-sets}.ts by
// scripts/gen-stratos-recipes.ts. Do not edit by hand. Every recipe here was
// produced by the real @facia/core resolver at build time.
import type { ComponentRecipe, DisclosureDepth } from '@facia/core';

export type RecipeDepthMap = Record<DisclosureDepth, ComponentRecipe>;

export const STRATOS_RECIPES: Record<string, RecipeDepthMap> = {
 "tension:advantage:l": {
  "glance": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does advantage come from assets the company controls or interactions it enables?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Define the minimum viable control position: own the differentiators; open the rest."
      },
      "operation": {
       "id": "stratos.place.advantage",
       "name": "Place position on Advantage"
      },
      "input": -0.5,
      "output": "Controlled value chain",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "porter_01",
        "maister_07",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Controlled value chain"
      },
      {
       "step": "owner.resolved",
       "value": "Strategy"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Define the minimum viable control position: own the differentiators; open the rest.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does advantage come from assets the company controls or interactions it enables?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Define the minimum viable control position: own the differentiators; open the rest."
      },
      "operation": {
       "id": "stratos.place.advantage",
       "name": "Place position on Advantage"
      },
      "input": -0.5,
      "output": "Controlled value chain",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "porter_01",
        "maister_07",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Controlled value chain"
      },
      {
       "step": "owner.resolved",
       "value": "Strategy"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Define the minimum viable control position: own the differentiators; open the rest.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does advantage come from assets the company controls or interactions it enables?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Define the minimum viable control position: own the differentiators; open the rest."
      },
      "operation": {
       "id": "stratos.place.advantage",
       "name": "Place position on Advantage"
      },
      "input": -0.5,
      "output": "Controlled value chain",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "porter_01",
        "maister_07",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Controlled value chain"
      },
      {
       "step": "owner.resolved",
       "value": "Strategy"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Define the minimum viable control position: own the differentiators; open the rest.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does advantage come from assets the company controls or interactions it enables?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Define the minimum viable control position: own the differentiators; open the rest."
      },
      "operation": {
       "id": "stratos.place.advantage",
       "name": "Place position on Advantage"
      },
      "input": -0.5,
      "output": "Controlled value chain",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "porter_01",
        "maister_07",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Controlled value chain"
      },
      {
       "step": "owner.resolved",
       "value": "Strategy"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Define the minimum viable control position: own the differentiators; open the rest.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:advantage:neutral": {
  "glance": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does advantage come from assets the company controls or interactions it enables?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.advantage",
       "name": "Place position on Advantage"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "porter_01",
        "maister_07",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does advantage come from assets the company controls or interactions it enables?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.advantage",
       "name": "Place position on Advantage"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "porter_01",
        "maister_07",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does advantage come from assets the company controls or interactions it enables?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.advantage",
       "name": "Place position on Advantage"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "porter_01",
        "maister_07",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does advantage come from assets the company controls or interactions it enables?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.advantage",
       "name": "Place position on Advantage"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "porter_01",
        "maister_07",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:advantage:r": {
  "glance": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does advantage come from assets the company controls or interactions it enables?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Move from partnership announcements to participant economics."
      },
      "operation": {
       "id": "stratos.place.advantage",
       "name": "Place position on Advantage"
      },
      "input": 0.5,
      "output": "Orchestrated ecosystem",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "porter_01",
        "maister_07",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Orchestrated ecosystem"
      },
      {
       "step": "owner.resolved",
       "value": "Marketing"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Move from partnership announcements to participant economics.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does advantage come from assets the company controls or interactions it enables?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Move from partnership announcements to participant economics."
      },
      "operation": {
       "id": "stratos.place.advantage",
       "name": "Place position on Advantage"
      },
      "input": 0.5,
      "output": "Orchestrated ecosystem",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "porter_01",
        "maister_07",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Orchestrated ecosystem"
      },
      {
       "step": "owner.resolved",
       "value": "Marketing"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Move from partnership announcements to participant economics.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does advantage come from assets the company controls or interactions it enables?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Move from partnership announcements to participant economics."
      },
      "operation": {
       "id": "stratos.place.advantage",
       "name": "Place position on Advantage"
      },
      "input": 0.5,
      "output": "Orchestrated ecosystem",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "porter_01",
        "maister_07",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Orchestrated ecosystem"
      },
      {
       "step": "owner.resolved",
       "value": "Marketing"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Move from partnership announcements to participant economics.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does advantage come from assets the company controls or interactions it enables?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Move from partnership announcements to participant economics."
      },
      "operation": {
       "id": "stratos.place.advantage",
       "name": "Place position on Advantage"
      },
      "input": 0.5,
      "output": "Orchestrated ecosystem",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "porter_01",
        "maister_07",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.advantage",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Orchestrated ecosystem"
      },
      {
       "step": "owner.resolved",
       "value": "Marketing"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Move from partnership announcements to participant economics.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "officer:advantage:l": {
  "glance": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Strategy answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Strategy",
       "because": "Advantage · Controlled value chain",
       "mandate": "Protect the activities, assets, and economics the company must own to remain defensible.",
       "questions": "What must the company own for its promise to remain credible? · Where is partner dependence becoming concentration risk? · Which reusable assets need explicit economic accountability?"
      },
      "value": "Strategy",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Controlled value chain"
      },
      {
       "step": "owner.resolved",
       "value": "Strategy"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Strategy",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Strategy answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Strategy",
       "because": "Advantage · Controlled value chain",
       "mandate": "Protect the activities, assets, and economics the company must own to remain defensible.",
       "questions": "What must the company own for its promise to remain credible? · Where is partner dependence becoming concentration risk? · Which reusable assets need explicit economic accountability?"
      },
      "value": "Strategy",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Controlled value chain"
      },
      {
       "step": "owner.resolved",
       "value": "Strategy"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Strategy",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Advantage · Controlled value chain",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Strategy answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Strategy",
       "because": "Advantage · Controlled value chain",
       "mandate": "Protect the activities, assets, and economics the company must own to remain defensible.",
       "questions": "What must the company own for its promise to remain credible? · Where is partner dependence becoming concentration risk? · Which reusable assets need explicit economic accountability?"
      },
      "value": "Strategy",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Controlled value chain"
      },
      {
       "step": "owner.resolved",
       "value": "Strategy"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Strategy",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Advantage · Controlled value chain",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Protect the activities, assets, and economics the company must own to remain defensible.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What must the company own for its promise to remain credible? · Where is partner dependence becoming concentration risk? · Which reusable assets need explicit economic accountability?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Strategy answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Strategy",
       "because": "Advantage · Controlled value chain",
       "mandate": "Protect the activities, assets, and economics the company must own to remain defensible.",
       "questions": "What must the company own for its promise to remain credible? · Where is partner dependence becoming concentration risk? · Which reusable assets need explicit economic accountability?"
      },
      "value": "Strategy",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Controlled value chain"
      },
      {
       "step": "owner.resolved",
       "value": "Strategy"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Strategy",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Advantage · Controlled value chain",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Protect the activities, assets, and economics the company must own to remain defensible.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What must the company own for its promise to remain credible? · Where is partner dependence becoming concentration risk? · Which reusable assets need explicit economic accountability?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "officer:advantage:r": {
  "glance": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Marketing answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Marketing",
       "because": "Advantage · Orchestrated ecosystem",
       "mandate": "Turn partner, expert, client, alumni, and technology participation into measurable market value.",
       "questions": "Which participants create value rather than just reach? · Where do network effects exist, and where is the company subcontracting? · How is ecosystem value shared across clients, contributors, and the company?"
      },
      "value": "Marketing",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Orchestrated ecosystem"
      },
      {
       "step": "owner.resolved",
       "value": "Marketing"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Marketing",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Marketing answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Marketing",
       "because": "Advantage · Orchestrated ecosystem",
       "mandate": "Turn partner, expert, client, alumni, and technology participation into measurable market value.",
       "questions": "Which participants create value rather than just reach? · Where do network effects exist, and where is the company subcontracting? · How is ecosystem value shared across clients, contributors, and the company?"
      },
      "value": "Marketing",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Orchestrated ecosystem"
      },
      {
       "step": "owner.resolved",
       "value": "Marketing"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Marketing",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Advantage · Orchestrated ecosystem",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Marketing answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Marketing",
       "because": "Advantage · Orchestrated ecosystem",
       "mandate": "Turn partner, expert, client, alumni, and technology participation into measurable market value.",
       "questions": "Which participants create value rather than just reach? · Where do network effects exist, and where is the company subcontracting? · How is ecosystem value shared across clients, contributors, and the company?"
      },
      "value": "Marketing",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Orchestrated ecosystem"
      },
      {
       "step": "owner.resolved",
       "value": "Marketing"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Marketing",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Advantage · Orchestrated ecosystem",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Turn partner, expert, client, alumni, and technology participation into measurable market value.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "Which participants create value rather than just reach? · Where do network effects exist, and where is the company subcontracting? · How is ecosystem value shared across clients, contributors, and the company?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Marketing answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Marketing",
       "because": "Advantage · Orchestrated ecosystem",
       "mandate": "Turn partner, expert, client, alumni, and technology participation into measurable market value.",
       "questions": "Which participants create value rather than just reach? · Where do network effects exist, and where is the company subcontracting? · How is ecosystem value shared across clients, contributors, and the company?"
      },
      "value": "Marketing",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.advantage",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Orchestrated ecosystem"
      },
      {
       "step": "owner.resolved",
       "value": "Marketing"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Marketing",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Advantage · Orchestrated ecosystem",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Turn partner, expert, client, alumni, and technology participation into measurable market value.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "Which participants create value rather than just reach? · Where do network effects exist, and where is the company subcontracting? · How is ecosystem value shared across clients, contributors, and the company?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:resource:l": {
  "glance": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Is the company preserving the capacity that produces value, and does that capacity realize a durable return?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Treat workforce capacity as a strategic asset, not a utilization pool."
      },
      "operation": {
       "id": "stratos.place.resource",
       "name": "Place position on Resource"
      },
      "input": -0.5,
      "output": "Workforce capacity",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "ton_10",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Workforce capacity"
      },
      {
       "step": "owner.resolved",
       "value": "People"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Treat workforce capacity as a strategic asset, not a utilization pool.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Is the company preserving the capacity that produces value, and does that capacity realize a durable return?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Treat workforce capacity as a strategic asset, not a utilization pool."
      },
      "operation": {
       "id": "stratos.place.resource",
       "name": "Place position on Resource"
      },
      "input": -0.5,
      "output": "Workforce capacity",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "ton_10",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Workforce capacity"
      },
      {
       "step": "owner.resolved",
       "value": "People"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Treat workforce capacity as a strategic asset, not a utilization pool.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Is the company preserving the capacity that produces value, and does that capacity realize a durable return?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Treat workforce capacity as a strategic asset, not a utilization pool."
      },
      "operation": {
       "id": "stratos.place.resource",
       "name": "Place position on Resource"
      },
      "input": -0.5,
      "output": "Workforce capacity",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "ton_10",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Workforce capacity"
      },
      {
       "step": "owner.resolved",
       "value": "People"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Treat workforce capacity as a strategic asset, not a utilization pool.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Is the company preserving the capacity that produces value, and does that capacity realize a durable return?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Treat workforce capacity as a strategic asset, not a utilization pool."
      },
      "operation": {
       "id": "stratos.place.resource",
       "name": "Place position on Resource"
      },
      "input": -0.5,
      "output": "Workforce capacity",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "ton_10",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Workforce capacity"
      },
      {
       "step": "owner.resolved",
       "value": "People"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Treat workforce capacity as a strategic asset, not a utilization pool.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:resource:neutral": {
  "glance": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Is the company preserving the capacity that produces value, and does that capacity realize a durable return?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.resource",
       "name": "Place position on Resource"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "ton_10",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Is the company preserving the capacity that produces value, and does that capacity realize a durable return?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.resource",
       "name": "Place position on Resource"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "ton_10",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Is the company preserving the capacity that produces value, and does that capacity realize a durable return?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.resource",
       "name": "Place position on Resource"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "ton_10",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Is the company preserving the capacity that produces value, and does that capacity realize a durable return?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.resource",
       "name": "Place position on Resource"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "ton_10",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:resource:r": {
  "glance": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Is the company preserving the capacity that produces value, and does that capacity realize a durable return?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Use RPE diagnostically — never as a standalone target."
      },
      "operation": {
       "id": "stratos.place.resource",
       "name": "Place position on Resource"
      },
      "input": 0.5,
      "output": "Capital return",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "ton_10",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Capital return"
      },
      {
       "step": "owner.resolved",
       "value": "Finance"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Use RPE diagnostically — never as a standalone target.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Is the company preserving the capacity that produces value, and does that capacity realize a durable return?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Use RPE diagnostically — never as a standalone target."
      },
      "operation": {
       "id": "stratos.place.resource",
       "name": "Place position on Resource"
      },
      "input": 0.5,
      "output": "Capital return",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "ton_10",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Capital return"
      },
      {
       "step": "owner.resolved",
       "value": "Finance"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Use RPE diagnostically — never as a standalone target.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Is the company preserving the capacity that produces value, and does that capacity realize a durable return?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Use RPE diagnostically — never as a standalone target."
      },
      "operation": {
       "id": "stratos.place.resource",
       "name": "Place position on Resource"
      },
      "input": 0.5,
      "output": "Capital return",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "ton_10",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Capital return"
      },
      {
       "step": "owner.resolved",
       "value": "Finance"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Use RPE diagnostically — never as a standalone target.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Is the company preserving the capacity that produces value, and does that capacity realize a durable return?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Use RPE diagnostically — never as a standalone target."
      },
      "operation": {
       "id": "stratos.place.resource",
       "name": "Place position on Resource"
      },
      "input": 0.5,
      "output": "Capital return",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "ton_10",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.resource",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Capital return"
      },
      {
       "step": "owner.resolved",
       "value": "Finance"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Use RPE diagnostically — never as a standalone target.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "officer:resource:l": {
  "glance": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must People answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "People",
       "because": "Resource · Workforce capacity",
       "mandate": "Protect skill coverage, retention, learning, resilience, and readiness as RPE and automation pressures rise.",
       "questions": "Which capabilities are becoming scarce? · How is AI changing apprenticeship? · Is RPE rising because capability is increasing or being depleted?"
      },
      "value": "People",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Workforce capacity"
      },
      {
       "step": "owner.resolved",
       "value": "People"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "People",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must People answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "People",
       "because": "Resource · Workforce capacity",
       "mandate": "Protect skill coverage, retention, learning, resilience, and readiness as RPE and automation pressures rise.",
       "questions": "Which capabilities are becoming scarce? · How is AI changing apprenticeship? · Is RPE rising because capability is increasing or being depleted?"
      },
      "value": "People",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Workforce capacity"
      },
      {
       "step": "owner.resolved",
       "value": "People"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "People",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Resource · Workforce capacity",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must People answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "People",
       "because": "Resource · Workforce capacity",
       "mandate": "Protect skill coverage, retention, learning, resilience, and readiness as RPE and automation pressures rise.",
       "questions": "Which capabilities are becoming scarce? · How is AI changing apprenticeship? · Is RPE rising because capability is increasing or being depleted?"
      },
      "value": "People",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Workforce capacity"
      },
      {
       "step": "owner.resolved",
       "value": "People"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "People",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Resource · Workforce capacity",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Protect skill coverage, retention, learning, resilience, and readiness as RPE and automation pressures rise.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "Which capabilities are becoming scarce? · How is AI changing apprenticeship? · Is RPE rising because capability is increasing or being depleted?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must People answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "People",
       "because": "Resource · Workforce capacity",
       "mandate": "Protect skill coverage, retention, learning, resilience, and readiness as RPE and automation pressures rise.",
       "questions": "Which capabilities are becoming scarce? · How is AI changing apprenticeship? · Is RPE rising because capability is increasing or being depleted?"
      },
      "value": "People",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Workforce capacity"
      },
      {
       "step": "owner.resolved",
       "value": "People"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "People",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Resource · Workforce capacity",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Protect skill coverage, retention, learning, resilience, and readiness as RPE and automation pressures rise.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "Which capabilities are becoming scarce? · How is AI changing apprenticeship? · Is RPE rising because capability is increasing or being depleted?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "officer:resource:r": {
  "glance": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Finance answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Finance",
       "because": "Resource · Capital return",
       "mandate": "Convert workforce, systems, IP, acquisitions, relationships, and data into durable economic return.",
       "questions": "What drives RPE? · Is return recurring or engagement-dependent? · Does system investment reduce marginal delivery cost?"
      },
      "value": "Finance",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Capital return"
      },
      {
       "step": "owner.resolved",
       "value": "Finance"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Finance",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Finance answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Finance",
       "because": "Resource · Capital return",
       "mandate": "Convert workforce, systems, IP, acquisitions, relationships, and data into durable economic return.",
       "questions": "What drives RPE? · Is return recurring or engagement-dependent? · Does system investment reduce marginal delivery cost?"
      },
      "value": "Finance",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Capital return"
      },
      {
       "step": "owner.resolved",
       "value": "Finance"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Finance",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Resource · Capital return",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Finance answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Finance",
       "because": "Resource · Capital return",
       "mandate": "Convert workforce, systems, IP, acquisitions, relationships, and data into durable economic return.",
       "questions": "What drives RPE? · Is return recurring or engagement-dependent? · Does system investment reduce marginal delivery cost?"
      },
      "value": "Finance",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Capital return"
      },
      {
       "step": "owner.resolved",
       "value": "Finance"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Finance",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Resource · Capital return",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Convert workforce, systems, IP, acquisitions, relationships, and data into durable economic return.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What drives RPE? · Is return recurring or engagement-dependent? · Does system investment reduce marginal delivery cost?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Finance answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Finance",
       "because": "Resource · Capital return",
       "mandate": "Convert workforce, systems, IP, acquisitions, relationships, and data into durable economic return.",
       "questions": "What drives RPE? · Is return recurring or engagement-dependent? · Does system investment reduce marginal delivery cost?"
      },
      "value": "Finance",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.resource",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Capital return"
      },
      {
       "step": "owner.resolved",
       "value": "Finance"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Finance",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Resource · Capital return",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Convert workforce, systems, IP, acquisitions, relationships, and data into durable economic return.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What drives RPE? · Is return recurring or engagement-dependent? · Does system investment reduce marginal delivery cost?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:discernment:l": {
  "glance": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "When should the company impose a clear answer, and when keep the problem open?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Distinguish productive conviction from premature closure."
      },
      "operation": {
       "id": "stratos.place.discernment",
       "name": "Place position on Discernment"
      },
      "input": -0.5,
      "output": "Structured conviction",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "minto_02",
        "▶",
        "parker_11"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Structured conviction"
      },
      {
       "step": "owner.resolved",
       "value": "Executive"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Distinguish productive conviction from premature closure.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "When should the company impose a clear answer, and when keep the problem open?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Distinguish productive conviction from premature closure."
      },
      "operation": {
       "id": "stratos.place.discernment",
       "name": "Place position on Discernment"
      },
      "input": -0.5,
      "output": "Structured conviction",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "minto_02",
        "▶",
        "parker_11"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Structured conviction"
      },
      {
       "step": "owner.resolved",
       "value": "Executive"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Distinguish productive conviction from premature closure.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "When should the company impose a clear answer, and when keep the problem open?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Distinguish productive conviction from premature closure."
      },
      "operation": {
       "id": "stratos.place.discernment",
       "name": "Place position on Discernment"
      },
      "input": -0.5,
      "output": "Structured conviction",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "minto_02",
        "▶",
        "parker_11"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Structured conviction"
      },
      {
       "step": "owner.resolved",
       "value": "Executive"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Distinguish productive conviction from premature closure.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "When should the company impose a clear answer, and when keep the problem open?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Distinguish productive conviction from premature closure."
      },
      "operation": {
       "id": "stratos.place.discernment",
       "name": "Place position on Discernment"
      },
      "input": -0.5,
      "output": "Structured conviction",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "minto_02",
        "▶",
        "parker_11"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Structured conviction"
      },
      {
       "step": "owner.resolved",
       "value": "Executive"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Distinguish productive conviction from premature closure.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:discernment:neutral": {
  "glance": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "When should the company impose a clear answer, and when keep the problem open?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.discernment",
       "name": "Place position on Discernment"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "minto_02",
        "▶",
        "parker_11"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "When should the company impose a clear answer, and when keep the problem open?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.discernment",
       "name": "Place position on Discernment"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "minto_02",
        "▶",
        "parker_11"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "When should the company impose a clear answer, and when keep the problem open?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.discernment",
       "name": "Place position on Discernment"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "minto_02",
        "▶",
        "parker_11"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "When should the company impose a clear answer, and when keep the problem open?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.discernment",
       "name": "Place position on Discernment"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "minto_02",
        "▶",
        "parker_11"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:discernment:r": {
  "glance": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "When should the company impose a clear answer, and when keep the problem open?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Make uncertainty visible before executive commitment."
      },
      "operation": {
       "id": "stratos.place.discernment",
       "name": "Place position on Discernment"
      },
      "input": 0.5,
      "output": "Open inquiry",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "minto_02",
        "▶",
        "parker_11"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Open inquiry"
      },
      {
       "step": "owner.resolved",
       "value": "Data"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Make uncertainty visible before executive commitment.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "When should the company impose a clear answer, and when keep the problem open?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Make uncertainty visible before executive commitment."
      },
      "operation": {
       "id": "stratos.place.discernment",
       "name": "Place position on Discernment"
      },
      "input": 0.5,
      "output": "Open inquiry",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "minto_02",
        "▶",
        "parker_11"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Open inquiry"
      },
      {
       "step": "owner.resolved",
       "value": "Data"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Make uncertainty visible before executive commitment.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "When should the company impose a clear answer, and when keep the problem open?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Make uncertainty visible before executive commitment."
      },
      "operation": {
       "id": "stratos.place.discernment",
       "name": "Place position on Discernment"
      },
      "input": 0.5,
      "output": "Open inquiry",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "minto_02",
        "▶",
        "parker_11"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Open inquiry"
      },
      {
       "step": "owner.resolved",
       "value": "Data"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Make uncertainty visible before executive commitment.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "When should the company impose a clear answer, and when keep the problem open?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Make uncertainty visible before executive commitment."
      },
      "operation": {
       "id": "stratos.place.discernment",
       "name": "Place position on Discernment"
      },
      "input": 0.5,
      "output": "Open inquiry",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "minto_02",
        "▶",
        "parker_11"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.discernment",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Open inquiry"
      },
      {
       "step": "owner.resolved",
       "value": "Data"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Make uncertainty visible before executive commitment.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "officer:discernment:l": {
  "glance": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Executive answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Executive",
       "because": "Discernment · Structured conviction",
       "mandate": "Set clear theses, decision rights, and commitment discipline without premature closure.",
       "questions": "What must be decided now? · What evidence would justify delaying commitment? · Which decisions are reversible, and who owns reversal?"
      },
      "value": "Executive",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Structured conviction"
      },
      {
       "step": "owner.resolved",
       "value": "Executive"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Executive",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Executive answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Executive",
       "because": "Discernment · Structured conviction",
       "mandate": "Set clear theses, decision rights, and commitment discipline without premature closure.",
       "questions": "What must be decided now? · What evidence would justify delaying commitment? · Which decisions are reversible, and who owns reversal?"
      },
      "value": "Executive",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Structured conviction"
      },
      {
       "step": "owner.resolved",
       "value": "Executive"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Executive",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Discernment · Structured conviction",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Executive answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Executive",
       "because": "Discernment · Structured conviction",
       "mandate": "Set clear theses, decision rights, and commitment discipline without premature closure.",
       "questions": "What must be decided now? · What evidence would justify delaying commitment? · Which decisions are reversible, and who owns reversal?"
      },
      "value": "Executive",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Structured conviction"
      },
      {
       "step": "owner.resolved",
       "value": "Executive"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Executive",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Discernment · Structured conviction",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Set clear theses, decision rights, and commitment discipline without premature closure.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What must be decided now? · What evidence would justify delaying commitment? · Which decisions are reversible, and who owns reversal?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Executive answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Executive",
       "because": "Discernment · Structured conviction",
       "mandate": "Set clear theses, decision rights, and commitment discipline without premature closure.",
       "questions": "What must be decided now? · What evidence would justify delaying commitment? · Which decisions are reversible, and who owns reversal?"
      },
      "value": "Executive",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Structured conviction"
      },
      {
       "step": "owner.resolved",
       "value": "Executive"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Executive",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Discernment · Structured conviction",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Set clear theses, decision rights, and commitment discipline without premature closure.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What must be decided now? · What evidence would justify delaying commitment? · Which decisions are reversible, and who owns reversal?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "officer:discernment:r": {
  "glance": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Data answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Data",
       "because": "Discernment · Open inquiry",
       "mandate": "Ensure external evidence, disconfirming data, and alternative interpretations can change commitments before lock-in.",
       "questions": "What evidence could change the current thesis? · Is disconfirming evidence visible before resource commitment? · Where do incentives encourage confirmation?"
      },
      "value": "Data",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Open inquiry"
      },
      {
       "step": "owner.resolved",
       "value": "Data"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Data",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Data answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Data",
       "because": "Discernment · Open inquiry",
       "mandate": "Ensure external evidence, disconfirming data, and alternative interpretations can change commitments before lock-in.",
       "questions": "What evidence could change the current thesis? · Is disconfirming evidence visible before resource commitment? · Where do incentives encourage confirmation?"
      },
      "value": "Data",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Open inquiry"
      },
      {
       "step": "owner.resolved",
       "value": "Data"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Data",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Discernment · Open inquiry",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Data answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Data",
       "because": "Discernment · Open inquiry",
       "mandate": "Ensure external evidence, disconfirming data, and alternative interpretations can change commitments before lock-in.",
       "questions": "What evidence could change the current thesis? · Is disconfirming evidence visible before resource commitment? · Where do incentives encourage confirmation?"
      },
      "value": "Data",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Open inquiry"
      },
      {
       "step": "owner.resolved",
       "value": "Data"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Data",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Discernment · Open inquiry",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Ensure external evidence, disconfirming data, and alternative interpretations can change commitments before lock-in.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What evidence could change the current thesis? · Is disconfirming evidence visible before resource commitment? · Where do incentives encourage confirmation?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Data answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Data",
       "because": "Discernment · Open inquiry",
       "mandate": "Ensure external evidence, disconfirming data, and alternative interpretations can change commitments before lock-in.",
       "questions": "What evidence could change the current thesis? · Is disconfirming evidence visible before resource commitment? · Where do incentives encourage confirmation?"
      },
      "value": "Data",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.discernment",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Open inquiry"
      },
      {
       "step": "owner.resolved",
       "value": "Data"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Data",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Discernment · Open inquiry",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Ensure external evidence, disconfirming data, and alternative interpretations can change commitments before lock-in.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What evidence could change the current thesis? · Is disconfirming evidence visible before resource commitment? · Where do incentives encourage confirmation?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:execution:l": {
  "glance": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must be assured inside the company, and what is ready to be released into the environment?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Build differentiated control paths by risk level."
      },
      "operation": {
       "id": "stratos.place.execution",
       "name": "Place position on Execution"
      },
      "input": -0.5,
      "output": "Risk friction",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nist_12",
        "anthropic_13",
        "▶",
        "teamops_14"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Risk friction"
      },
      {
       "step": "owner.resolved",
       "value": "Risk"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Build differentiated control paths by risk level.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must be assured inside the company, and what is ready to be released into the environment?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Build differentiated control paths by risk level."
      },
      "operation": {
       "id": "stratos.place.execution",
       "name": "Place position on Execution"
      },
      "input": -0.5,
      "output": "Risk friction",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nist_12",
        "anthropic_13",
        "▶",
        "teamops_14"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Risk friction"
      },
      {
       "step": "owner.resolved",
       "value": "Risk"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Build differentiated control paths by risk level.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must be assured inside the company, and what is ready to be released into the environment?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Build differentiated control paths by risk level."
      },
      "operation": {
       "id": "stratos.place.execution",
       "name": "Place position on Execution"
      },
      "input": -0.5,
      "output": "Risk friction",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nist_12",
        "anthropic_13",
        "▶",
        "teamops_14"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Risk friction"
      },
      {
       "step": "owner.resolved",
       "value": "Risk"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Build differentiated control paths by risk level.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must be assured inside the company, and what is ready to be released into the environment?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Build differentiated control paths by risk level."
      },
      "operation": {
       "id": "stratos.place.execution",
       "name": "Place position on Execution"
      },
      "input": -0.5,
      "output": "Risk friction",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nist_12",
        "anthropic_13",
        "▶",
        "teamops_14"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Risk friction"
      },
      {
       "step": "owner.resolved",
       "value": "Risk"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Build differentiated control paths by risk level.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:execution:neutral": {
  "glance": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must be assured inside the company, and what is ready to be released into the environment?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.execution",
       "name": "Place position on Execution"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nist_12",
        "anthropic_13",
        "▶",
        "teamops_14"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must be assured inside the company, and what is ready to be released into the environment?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.execution",
       "name": "Place position on Execution"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nist_12",
        "anthropic_13",
        "▶",
        "teamops_14"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must be assured inside the company, and what is ready to be released into the environment?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.execution",
       "name": "Place position on Execution"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nist_12",
        "anthropic_13",
        "▶",
        "teamops_14"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must be assured inside the company, and what is ready to be released into the environment?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.execution",
       "name": "Place position on Execution"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nist_12",
        "anthropic_13",
        "▶",
        "teamops_14"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:execution:r": {
  "glance": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must be assured inside the company, and what is ready to be released into the environment?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Create bounded release velocity."
      },
      "operation": {
       "id": "stratos.place.execution",
       "name": "Place position on Execution"
      },
      "input": 0.5,
      "output": "Release",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nist_12",
        "anthropic_13",
        "▶",
        "teamops_14"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Release"
      },
      {
       "step": "owner.resolved",
       "value": "Technology"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Create bounded release velocity.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must be assured inside the company, and what is ready to be released into the environment?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Create bounded release velocity."
      },
      "operation": {
       "id": "stratos.place.execution",
       "name": "Place position on Execution"
      },
      "input": 0.5,
      "output": "Release",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nist_12",
        "anthropic_13",
        "▶",
        "teamops_14"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Release"
      },
      {
       "step": "owner.resolved",
       "value": "Technology"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Create bounded release velocity.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must be assured inside the company, and what is ready to be released into the environment?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Create bounded release velocity."
      },
      "operation": {
       "id": "stratos.place.execution",
       "name": "Place position on Execution"
      },
      "input": 0.5,
      "output": "Release",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nist_12",
        "anthropic_13",
        "▶",
        "teamops_14"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Release"
      },
      {
       "step": "owner.resolved",
       "value": "Technology"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Create bounded release velocity.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must be assured inside the company, and what is ready to be released into the environment?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Create bounded release velocity."
      },
      "operation": {
       "id": "stratos.place.execution",
       "name": "Place position on Execution"
      },
      "input": 0.5,
      "output": "Release",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nist_12",
        "anthropic_13",
        "▶",
        "teamops_14"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.execution",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Release"
      },
      {
       "step": "owner.resolved",
       "value": "Technology"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Create bounded release velocity.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "officer:execution:l": {
  "glance": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Risk answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Risk",
       "because": "Execution · Risk friction",
       "mandate": "Keep autonomous action, professional judgment, and client exposure bounded, traceable, and accountable.",
       "questions": "What could cause irreversible harm? · Which actions require human authorization? · Can the company reconstruct how a conclusion was produced?"
      },
      "value": "Risk",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Risk friction"
      },
      {
       "step": "owner.resolved",
       "value": "Risk"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Risk",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Risk answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Risk",
       "because": "Execution · Risk friction",
       "mandate": "Keep autonomous action, professional judgment, and client exposure bounded, traceable, and accountable.",
       "questions": "What could cause irreversible harm? · Which actions require human authorization? · Can the company reconstruct how a conclusion was produced?"
      },
      "value": "Risk",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Risk friction"
      },
      {
       "step": "owner.resolved",
       "value": "Risk"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Risk",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Execution · Risk friction",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Risk answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Risk",
       "because": "Execution · Risk friction",
       "mandate": "Keep autonomous action, professional judgment, and client exposure bounded, traceable, and accountable.",
       "questions": "What could cause irreversible harm? · Which actions require human authorization? · Can the company reconstruct how a conclusion was produced?"
      },
      "value": "Risk",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Risk friction"
      },
      {
       "step": "owner.resolved",
       "value": "Risk"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Risk",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Execution · Risk friction",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Keep autonomous action, professional judgment, and client exposure bounded, traceable, and accountable.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What could cause irreversible harm? · Which actions require human authorization? · Can the company reconstruct how a conclusion was produced?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Risk answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Risk",
       "because": "Execution · Risk friction",
       "mandate": "Keep autonomous action, professional judgment, and client exposure bounded, traceable, and accountable.",
       "questions": "What could cause irreversible harm? · Which actions require human authorization? · Can the company reconstruct how a conclusion was produced?"
      },
      "value": "Risk",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Risk friction"
      },
      {
       "step": "owner.resolved",
       "value": "Risk"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Risk",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Execution · Risk friction",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Keep autonomous action, professional judgment, and client exposure bounded, traceable, and accountable.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What could cause irreversible harm? · Which actions require human authorization? · Can the company reconstruct how a conclusion was produced?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "officer:execution:r": {
  "glance": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Technology answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Technology",
       "because": "Execution · Release",
       "mandate": "Ship reversible, observable improvements fast enough to create adoption, feedback, and measurable value.",
       "questions": "What can safely ship now? · Is the release reversible? · Did deployment create adoption and measurable value?"
      },
      "value": "Technology",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Release"
      },
      {
       "step": "owner.resolved",
       "value": "Technology"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Technology",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Technology answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Technology",
       "because": "Execution · Release",
       "mandate": "Ship reversible, observable improvements fast enough to create adoption, feedback, and measurable value.",
       "questions": "What can safely ship now? · Is the release reversible? · Did deployment create adoption and measurable value?"
      },
      "value": "Technology",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Release"
      },
      {
       "step": "owner.resolved",
       "value": "Technology"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Technology",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Execution · Release",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Technology answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Technology",
       "because": "Execution · Release",
       "mandate": "Ship reversible, observable improvements fast enough to create adoption, feedback, and measurable value.",
       "questions": "What can safely ship now? · Is the release reversible? · Did deployment create adoption and measurable value?"
      },
      "value": "Technology",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Release"
      },
      {
       "step": "owner.resolved",
       "value": "Technology"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Technology",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Execution · Release",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Ship reversible, observable improvements fast enough to create adoption, feedback, and measurable value.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What can safely ship now? · Is the release reversible? · Did deployment create adoption and measurable value?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Technology answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Technology",
       "because": "Execution · Release",
       "mandate": "Ship reversible, observable improvements fast enough to create adoption, feedback, and measurable value.",
       "questions": "What can safely ship now? · Is the release reversible? · Did deployment create adoption and measurable value?"
      },
      "value": "Technology",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.execution",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Release"
      },
      {
       "step": "owner.resolved",
       "value": "Technology"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Technology",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Execution · Release",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Ship reversible, observable improvements fast enough to create adoption, feedback, and measurable value.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What can safely ship now? · Is the release reversible? · Did deployment create adoption and measurable value?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:invention:l": {
  "glance": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does renewal come from deepening what the company knows, or creating what the market has not seen?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Codify what improves quality, speed, and resilience."
      },
      "operation": {
       "id": "stratos.place.invention",
       "name": "Place position on Invention"
      },
      "input": -0.5,
      "output": "Codified fluency",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nonaka_17",
        "apqc_05",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Codified fluency"
      },
      {
       "step": "owner.resolved",
       "value": "Knowledge"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Codify what improves quality, speed, and resilience.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does renewal come from deepening what the company knows, or creating what the market has not seen?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Codify what improves quality, speed, and resilience."
      },
      "operation": {
       "id": "stratos.place.invention",
       "name": "Place position on Invention"
      },
      "input": -0.5,
      "output": "Codified fluency",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nonaka_17",
        "apqc_05",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Codified fluency"
      },
      {
       "step": "owner.resolved",
       "value": "Knowledge"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Codify what improves quality, speed, and resilience.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does renewal come from deepening what the company knows, or creating what the market has not seen?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Codify what improves quality, speed, and resilience."
      },
      "operation": {
       "id": "stratos.place.invention",
       "name": "Place position on Invention"
      },
      "input": -0.5,
      "output": "Codified fluency",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nonaka_17",
        "apqc_05",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Codified fluency"
      },
      {
       "step": "owner.resolved",
       "value": "Knowledge"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Codify what improves quality, speed, and resilience.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does renewal come from deepening what the company knows, or creating what the market has not seen?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Codify what improves quality, speed, and resilience."
      },
      "operation": {
       "id": "stratos.place.invention",
       "name": "Place position on Invention"
      },
      "input": -0.5,
      "output": "Codified fluency",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nonaka_17",
        "apqc_05",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Codified fluency"
      },
      {
       "step": "owner.resolved",
       "value": "Knowledge"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Codify what improves quality, speed, and resilience.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:invention:neutral": {
  "glance": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does renewal come from deepening what the company knows, or creating what the market has not seen?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.invention",
       "name": "Place position on Invention"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nonaka_17",
        "apqc_05",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does renewal come from deepening what the company knows, or creating what the market has not seen?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.invention",
       "name": "Place position on Invention"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nonaka_17",
        "apqc_05",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does renewal come from deepening what the company knows, or creating what the market has not seen?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.invention",
       "name": "Place position on Invention"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nonaka_17",
        "apqc_05",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does renewal come from deepening what the company knows, or creating what the market has not seen?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.invention",
       "name": "Place position on Invention"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nonaka_17",
        "apqc_05",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:invention:r": {
  "glance": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does renewal come from deepening what the company knows, or creating what the market has not seen?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Validate renewal through adoption, revenue, and repeatability."
      },
      "operation": {
       "id": "stratos.place.invention",
       "name": "Place position on Invention"
      },
      "input": 0.5,
      "output": "Novel offering creation",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nonaka_17",
        "apqc_05",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Novel offering creation"
      },
      {
       "step": "owner.resolved",
       "value": "Growth"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Validate renewal through adoption, revenue, and repeatability.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does renewal come from deepening what the company knows, or creating what the market has not seen?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Validate renewal through adoption, revenue, and repeatability."
      },
      "operation": {
       "id": "stratos.place.invention",
       "name": "Place position on Invention"
      },
      "input": 0.5,
      "output": "Novel offering creation",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nonaka_17",
        "apqc_05",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Novel offering creation"
      },
      {
       "step": "owner.resolved",
       "value": "Growth"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Validate renewal through adoption, revenue, and repeatability.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does renewal come from deepening what the company knows, or creating what the market has not seen?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Validate renewal through adoption, revenue, and repeatability."
      },
      "operation": {
       "id": "stratos.place.invention",
       "name": "Place position on Invention"
      },
      "input": 0.5,
      "output": "Novel offering creation",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nonaka_17",
        "apqc_05",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Novel offering creation"
      },
      {
       "step": "owner.resolved",
       "value": "Growth"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Validate renewal through adoption, revenue, and repeatability.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does renewal come from deepening what the company knows, or creating what the market has not seen?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Validate renewal through adoption, revenue, and repeatability."
      },
      "operation": {
       "id": "stratos.place.invention",
       "name": "Place position on Invention"
      },
      "input": 0.5,
      "output": "Novel offering creation",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "nonaka_17",
        "apqc_05",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.invention",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Novel offering creation"
      },
      {
       "step": "owner.resolved",
       "value": "Growth"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Validate renewal through adoption, revenue, and repeatability.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "officer:invention:l": {
  "glance": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Knowledge answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Knowledge",
       "because": "Invention · Codified fluency",
       "mandate": "Turn experience into reusable institutional capability without flattening expert judgment.",
       "questions": "What knowledge is strategically reusable? · Which expertise cannot be separated from practitioner judgment? · How quickly does this knowledge become obsolete?"
      },
      "value": "Knowledge",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Codified fluency"
      },
      {
       "step": "owner.resolved",
       "value": "Knowledge"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Knowledge",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Knowledge answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Knowledge",
       "because": "Invention · Codified fluency",
       "mandate": "Turn experience into reusable institutional capability without flattening expert judgment.",
       "questions": "What knowledge is strategically reusable? · Which expertise cannot be separated from practitioner judgment? · How quickly does this knowledge become obsolete?"
      },
      "value": "Knowledge",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Codified fluency"
      },
      {
       "step": "owner.resolved",
       "value": "Knowledge"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Knowledge",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Invention · Codified fluency",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Knowledge answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Knowledge",
       "because": "Invention · Codified fluency",
       "mandate": "Turn experience into reusable institutional capability without flattening expert judgment.",
       "questions": "What knowledge is strategically reusable? · Which expertise cannot be separated from practitioner judgment? · How quickly does this knowledge become obsolete?"
      },
      "value": "Knowledge",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Codified fluency"
      },
      {
       "step": "owner.resolved",
       "value": "Knowledge"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Knowledge",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Invention · Codified fluency",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Turn experience into reusable institutional capability without flattening expert judgment.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What knowledge is strategically reusable? · Which expertise cannot be separated from practitioner judgment? · How quickly does this knowledge become obsolete?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Knowledge answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Knowledge",
       "because": "Invention · Codified fluency",
       "mandate": "Turn experience into reusable institutional capability without flattening expert judgment.",
       "questions": "What knowledge is strategically reusable? · Which expertise cannot be separated from practitioner judgment? · How quickly does this knowledge become obsolete?"
      },
      "value": "Knowledge",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Codified fluency"
      },
      {
       "step": "owner.resolved",
       "value": "Knowledge"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Knowledge",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Invention · Codified fluency",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Turn experience into reusable institutional capability without flattening expert judgment.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What knowledge is strategically reusable? · Which expertise cannot be separated from practitioner judgment? · How quickly does this knowledge become obsolete?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "officer:invention:r": {
  "glance": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Growth answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Growth",
       "because": "Invention · Novel offering creation",
       "mandate": "Create offerings that customers adopt, pay for, renew, or use to define a new category of need.",
       "questions": "What proves an offering is genuinely new? · Has the market adopted or renewed it? · Does it create repeatable economics?"
      },
      "value": "Growth",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Novel offering creation"
      },
      {
       "step": "owner.resolved",
       "value": "Growth"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Growth",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Growth answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Growth",
       "because": "Invention · Novel offering creation",
       "mandate": "Create offerings that customers adopt, pay for, renew, or use to define a new category of need.",
       "questions": "What proves an offering is genuinely new? · Has the market adopted or renewed it? · Does it create repeatable economics?"
      },
      "value": "Growth",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Novel offering creation"
      },
      {
       "step": "owner.resolved",
       "value": "Growth"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Growth",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Invention · Novel offering creation",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Growth answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Growth",
       "because": "Invention · Novel offering creation",
       "mandate": "Create offerings that customers adopt, pay for, renew, or use to define a new category of need.",
       "questions": "What proves an offering is genuinely new? · Has the market adopted or renewed it? · Does it create repeatable economics?"
      },
      "value": "Growth",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Novel offering creation"
      },
      {
       "step": "owner.resolved",
       "value": "Growth"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Growth",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Invention · Novel offering creation",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Create offerings that customers adopt, pay for, renew, or use to define a new category of need.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What proves an offering is genuinely new? · Has the market adopted or renewed it? · Does it create repeatable economics?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Growth answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Growth",
       "because": "Invention · Novel offering creation",
       "mandate": "Create offerings that customers adopt, pay for, renew, or use to define a new category of need.",
       "questions": "What proves an offering is genuinely new? · Has the market adopted or renewed it? · Does it create repeatable economics?"
      },
      "value": "Growth",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.invention",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Novel offering creation"
      },
      {
       "step": "owner.resolved",
       "value": "Growth"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Growth",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Invention · Novel offering creation",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Create offerings that customers adopt, pay for, renew, or use to define a new category of need.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "What proves an offering is genuinely new? · Has the market adopted or renewed it? · Does it create repeatable economics?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:operations:l": {
  "glance": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does output come from applied effort or from systems that remove the need for it?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Automate avoidable effort while preserving expert intervention."
      },
      "operation": {
       "id": "stratos.place.operations",
       "name": "Place position on Operations"
      },
      "input": -0.5,
      "output": "Execution discipline",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "goldratt_04",
        "dora_15",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Execution discipline"
      },
      {
       "step": "owner.resolved",
       "value": "Operations"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Automate avoidable effort while preserving expert intervention.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does output come from applied effort or from systems that remove the need for it?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Automate avoidable effort while preserving expert intervention."
      },
      "operation": {
       "id": "stratos.place.operations",
       "name": "Place position on Operations"
      },
      "input": -0.5,
      "output": "Execution discipline",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "goldratt_04",
        "dora_15",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Execution discipline"
      },
      {
       "step": "owner.resolved",
       "value": "Operations"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Automate avoidable effort while preserving expert intervention.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does output come from applied effort or from systems that remove the need for it?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Automate avoidable effort while preserving expert intervention."
      },
      "operation": {
       "id": "stratos.place.operations",
       "name": "Place position on Operations"
      },
      "input": -0.5,
      "output": "Execution discipline",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "goldratt_04",
        "dora_15",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Execution discipline"
      },
      {
       "step": "owner.resolved",
       "value": "Operations"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Automate avoidable effort while preserving expert intervention.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does output come from applied effort or from systems that remove the need for it?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Automate avoidable effort while preserving expert intervention."
      },
      "operation": {
       "id": "stratos.place.operations",
       "name": "Place position on Operations"
      },
      "input": -0.5,
      "output": "Execution discipline",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "goldratt_04",
        "dora_15",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Execution discipline"
      },
      {
       "step": "owner.resolved",
       "value": "Operations"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Automate avoidable effort while preserving expert intervention.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:operations:neutral": {
  "glance": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does output come from applied effort or from systems that remove the need for it?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.operations",
       "name": "Place position on Operations"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "goldratt_04",
        "dora_15",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does output come from applied effort or from systems that remove the need for it?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.operations",
       "name": "Place position on Operations"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "goldratt_04",
        "dora_15",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does output come from applied effort or from systems that remove the need for it?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.operations",
       "name": "Place position on Operations"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "goldratt_04",
        "dora_15",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "operation-detail",
   "patternReasonCode": "PATTERN_OPERATION_DETAIL",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does output come from applied effort or from systems that remove the need for it?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "status": "no position taken"
      },
      "operation": {
       "id": "stratos.place.operations",
       "name": "Place position on Operations"
      },
      "input": 0,
      "output": "no position taken",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "goldratt_04",
        "dora_15",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "status"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": 0
      },
      {
       "step": "pole.resolved",
       "value": "none — inside the ±0.05 dead zone"
      },
      {
       "step": "owner.resolved",
       "value": "unresolved — both advocates stand"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "status",
       "value": "no position taken",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "tension:operations:r": {
  "glance": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does output come from applied effort or from systems that remove the need for it?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Prioritize client-visible flow, not tool installation."
      },
      "operation": {
       "id": "stratos.place.operations",
       "name": "Place position on Operations"
      },
      "input": 0.5,
      "output": "Systems and flow",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "goldratt_04",
        "dora_15",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Systems and flow"
      },
      {
       "step": "owner.resolved",
       "value": "Information"
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Prioritize client-visible flow, not tool installation.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does output come from applied effort or from systems that remove the need for it?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Prioritize client-visible flow, not tool installation."
      },
      "operation": {
       "id": "stratos.place.operations",
       "name": "Place position on Operations"
      },
      "input": 0.5,
      "output": "Systems and flow",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "goldratt_04",
        "dora_15",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Systems and flow"
      },
      {
       "step": "owner.resolved",
       "value": "Information"
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Prioritize client-visible flow, not tool installation.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does output come from applied effort or from systems that remove the need for it?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Prioritize client-visible flow, not tool installation."
      },
      "operation": {
       "id": "stratos.place.operations",
       "name": "Place position on Operations"
      },
      "input": 0.5,
      "output": "Systems and flow",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "goldratt_04",
        "dora_15",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Systems and flow"
      },
      {
       "step": "owner.resolved",
       "value": "Information"
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Prioritize client-visible flow, not tool installation.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "action-panel",
   "patternReasonCode": "PATTERN_ACTIONABLE_OPERATION",
   "components": [
    {
     "id": "Card"
    },
    {
     "id": "OperationDetail"
    },
    {
     "id": "EvidenceDisclosure"
    },
    {
     "id": "OperationControls"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [
    {
     "operation": {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     },
     "reasonCode": "ACTION_OPERATION_DESCRIPTOR"
    }
   ],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Does output come from applied effort or from systems that remove the need for it?",
    "answerType": "operation",
    "path": "meaning",
    "inspection": "available",
    "actionable": true,
    "items": [
     {
      "type": "Operation",
      "payload": {
       "growthLens": "Prioritize client-visible flow, not tool installation."
      },
      "operation": {
       "id": "stratos.place.operations",
       "name": "Place position on Operations"
      },
      "input": 0.5,
      "output": "Systems and flow",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "goldratt_04",
        "dora_15",
        "▶"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "growthLens"
        ],
        "secondary": [],
        "supporting": [],
        "audit": []
       }
      }
     }
    ],
    "operations": [
     {
      "id": "stratos.agenda.operations",
      "label": "Carried to the board agenda",
      "invocation": "host-callback",
      "reference": "agenda.add"
     }
    ],
    "trace": {
     "kind": "direct",
     "id": "stratos.place.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Systems and flow"
      },
      {
       "step": "owner.resolved",
       "value": "Information"
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "growthLens",
       "value": "Prioritize client-visible flow, not tool installation.",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "officer:operations:l": {
  "glance": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Operations answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Operations",
       "because": "Operations · Execution discipline",
       "mandate": "Preserve reliable human execution, exception handling, and quality as delivery systems automate.",
       "questions": "Which tasks require professional judgment? · Where are exceptions concentrated? · Can the operation recover when automated systems fail?"
      },
      "value": "Operations",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Execution discipline"
      },
      {
       "step": "owner.resolved",
       "value": "Operations"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Operations",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Operations answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Operations",
       "because": "Operations · Execution discipline",
       "mandate": "Preserve reliable human execution, exception handling, and quality as delivery systems automate.",
       "questions": "Which tasks require professional judgment? · Where are exceptions concentrated? · Can the operation recover when automated systems fail?"
      },
      "value": "Operations",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Execution discipline"
      },
      {
       "step": "owner.resolved",
       "value": "Operations"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Operations",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Operations · Execution discipline",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Operations answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Operations",
       "because": "Operations · Execution discipline",
       "mandate": "Preserve reliable human execution, exception handling, and quality as delivery systems automate.",
       "questions": "Which tasks require professional judgment? · Where are exceptions concentrated? · Can the operation recover when automated systems fail?"
      },
      "value": "Operations",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Execution discipline"
      },
      {
       "step": "owner.resolved",
       "value": "Operations"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Operations",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Operations · Execution discipline",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Preserve reliable human execution, exception handling, and quality as delivery systems automate.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "Which tasks require professional judgment? · Where are exceptions concentrated? · Can the operation recover when automated systems fail?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Operations answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Operations",
       "because": "Operations · Execution discipline",
       "mandate": "Preserve reliable human execution, exception handling, and quality as delivery systems automate.",
       "questions": "Which tasks require professional judgment? · Where are exceptions concentrated? · Can the operation recover when automated systems fail?"
      },
      "value": "Operations",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": -0.5
      },
      {
       "step": "pole.resolved",
       "value": "Execution discipline"
      },
      {
       "step": "owner.resolved",
       "value": "Operations"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Operations",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Operations · Execution discipline",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Preserve reliable human execution, exception handling, and quality as delivery systems automate.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "Which tasks require professional judgment? · Where are exceptions concentrated? · Can the operation recover when automated systems fail?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "officer:operations:r": {
  "glance": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Information answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Information",
       "because": "Operations · Systems and flow",
       "mandate": "Use systems to remove avoidable effort and improve end-to-end client-visible speed, reliability, and quality.",
       "questions": "Where is the true end-to-end constraint? · What evidence proves flow improved? · Are systems interoperable across units and partners?"
      },
      "value": "Information",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Systems and flow"
      },
      {
       "step": "owner.resolved",
       "value": "Information"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Information",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "stat",
   "patternReasonCode": "PATTERN_COMPACT_SCALAR",
   "components": [
    {
     "id": "Stat"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Information answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Information",
       "because": "Operations · Systems and flow",
       "mandate": "Use systems to remove avoidable effort and improve end-to-end client-visible speed, reliability, and quality.",
       "questions": "Where is the true end-to-end constraint? · What evidence proves flow improved? · Are systems interoperable across units and partners?"
      },
      "value": "Information",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Systems and flow"
      },
      {
       "step": "owner.resolved",
       "value": "Information"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Information",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Operations · Systems and flow",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Information answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Information",
       "because": "Operations · Systems and flow",
       "mandate": "Use systems to remove avoidable effort and improve end-to-end client-visible speed, reliability, and quality.",
       "questions": "Where is the true end-to-end constraint? · What evidence proves flow improved? · Are systems interoperable across units and partners?"
      },
      "value": "Information",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Systems and flow"
      },
      {
       "step": "owner.resolved",
       "value": "Information"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Information",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Operations · Systems and flow",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Use systems to remove avoidable effort and improve end-to-end client-visible speed, reliability, and quality.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "Where is the true end-to-end constraint? · What evidence proves flow improved? · Are systems interoperable across units and partners?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VALUE",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence",
    "view-trace"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "What must Information answer?",
    "answerType": "value",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Value",
      "payload": {
       "function": "Information",
       "because": "Operations · Systems and flow",
       "mandate": "Use systems to remove avoidable effort and improve end-to-end client-visible speed, reliability, and quality.",
       "questions": "Where is the true end-to-end constraint? · What evidence proves flow improved? · Are systems interoperable across units and partners?"
      },
      "value": "Information",
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md",
        "StratOS_v5_CSuite_Micro_Reports.docx"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "function"
        ],
        "secondary": [
         "because"
        ],
        "supporting": [
         "mandate",
         "questions"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": [],
    "trace": {
     "kind": "direct",
     "id": "stratos.agenda.operations",
     "entries": [
      {
       "step": "position.declared",
       "value": 0.5
      },
      {
       "step": "pole.resolved",
       "value": "Systems and flow"
      },
      {
       "step": "owner.resolved",
       "value": "Information"
      },
      {
       "step": "questions.compiled",
       "value": 3
      }
     ]
    }
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "function",
       "value": "Information",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "because",
       "value": "Operations · Systems and flow",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "mandate",
       "value": "Use systems to remove avoidable effort and improve end-to-end client-visible speed, reliability, and quality.",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      },
      {
       "key": "questions",
       "value": "Where is the true end-to-end constraint? · What evidence proves flow improved? · Are systems interoperable across units and partners?",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 },
 "verdict": {
  "glance": {
   "pattern": "badge",
   "patternReasonCode": "PATTERN_COMPACT_VERDICT",
   "components": [
    {
     "id": "StateBadge"
    }
   ],
   "inspectionControls": [
    "inspect"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Has the company declared a material position?",
    "answerType": "verdict",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Verdict",
      "contract": "BoundedVerdictV1",
      "payload": {
       "state": "no material position declared",
       "threshold": "Commitment Index is below 0.20",
       "owner": "Executive, with Board oversight"
      },
      "state": "no material position declared",
      "conforms": false,
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "state"
        ],
        "secondary": [
         "threshold"
        ],
        "supporting": [
         "owner"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": []
   },
   "context": {
    "depth": "glance",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "state",
       "value": "no material position declared",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "inspect": {
   "pattern": "badge",
   "patternReasonCode": "PATTERN_COMPACT_VERDICT",
   "components": [
    {
     "id": "StateBadge"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Has the company declared a material position?",
    "answerType": "verdict",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Verdict",
      "contract": "BoundedVerdictV1",
      "payload": {
       "state": "no material position declared",
       "threshold": "Commitment Index is below 0.20",
       "owner": "Executive, with Board oversight"
      },
      "state": "no material position declared",
      "conforms": false,
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "state"
        ],
        "secondary": [
         "threshold"
        ],
        "supporting": [
         "owner"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": []
   },
   "context": {
    "depth": "inspect",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "state",
       "value": "no material position declared",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "threshold",
       "value": "Commitment Index is below 0.20",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "focus": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VERDICT",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Has the company declared a material position?",
    "answerType": "verdict",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Verdict",
      "contract": "BoundedVerdictV1",
      "payload": {
       "state": "no material position declared",
       "threshold": "Commitment Index is below 0.20",
       "owner": "Executive, with Board oversight"
      },
      "state": "no material position declared",
      "conforms": false,
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "state"
        ],
        "secondary": [
         "threshold"
        ],
        "supporting": [
         "owner"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": []
   },
   "context": {
    "depth": "focus",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "state",
       "value": "no material position declared",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "threshold",
       "value": "Commitment Index is below 0.20",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "owner",
       "value": "Executive, with Board oversight",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  },
  "audit": {
   "pattern": "detail",
   "patternReasonCode": "PATTERN_DEEP_VERDICT",
   "components": [
    {
     "id": "DetailView"
    },
    {
     "id": "EvidenceDisclosure"
    }
   ],
   "inspectionControls": [
    "inspect",
    "expand",
    "view-evidence"
   ],
   "actionControls": [],
   "answer": {
    "schema": "facia.answer-set/2",
    "question": "Has the company declared a material position?",
    "answerType": "verdict",
    "path": "meaning",
    "inspection": "available",
    "actionable": false,
    "items": [
     {
      "type": "Verdict",
      "contract": "BoundedVerdictV1",
      "payload": {
       "state": "no material position declared",
       "threshold": "Commitment Index is below 0.20",
       "owner": "Executive, with Board oversight"
      },
      "state": "no material position declared",
      "conforms": false,
      "evidence": {
       "status": "user-declared",
       "sourceRefs": [
        "_metadata/Tension_Model.md",
        "_metadata/Ownership_Model.md"
       ]
      },
      "fields": {
       "priority": {
        "primary": [
         "state"
        ],
        "secondary": [
         "threshold"
        ],
        "supporting": [
         "owner"
        ],
        "audit": []
       }
      }
     }
    ],
    "operations": []
   },
   "context": {
    "depth": "audit",
    "audience": "human"
   },
   "density": {
    "density": 1,
    "source": "derived"
   },
   "visibleFields": [
    {
     "itemIndex": 0,
     "fields": [
      {
       "key": "state",
       "value": "no material position declared",
       "declaredPriority": "primary",
       "effectivePriority": "primary",
       "promotionRuleIndices": []
      },
      {
       "key": "threshold",
       "value": "Commitment Index is below 0.20",
       "declaredPriority": "secondary",
       "effectivePriority": "secondary",
       "promotionRuleIndices": []
      },
      {
       "key": "owner",
       "value": "Executive, with Board oversight",
       "declaredPriority": "supporting",
       "effectivePriority": "supporting",
       "promotionRuleIndices": []
      }
     ]
    }
   ],
   "boundary": "Renderer consumes semantic specs; it does not evaluate Domain truth."
  }
 }
};
