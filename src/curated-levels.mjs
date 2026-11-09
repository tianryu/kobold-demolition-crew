// 原25张精编地图保留布局与存档ID；文字只说明目标，不泄露拆序。
export const CURATED_LEVELS = [
  {
    "id": "powder-yard",
    "title": "会炸的货场",
    "region": "旧城连锁",
    "brief": "拆除1处靶标目标，保全1处盾牌物件。其余物件可自行取舍。",
    "steps": 3,
    "pay": 35,
    "objects": [
      {
        "id": "tower",
        "x": 1.5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "powder",
        "x": 3.5,
        "kind": "barrel"
      },
      {
        "id": "cargo",
        "x": 4.5,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "gate",
        "x": 5.5,
        "kind": "gate"
      }
    ],
    "goals": [
      "gate"
    ],
    "protect": [
      "cargo"
    ],
    "chapter": 1,
    "revision": 1,
    "intro": {
      "kind": "brace",
      "id": "cargo"
    }
  },
  {
    "id": "break-the-chain",
    "title": "串火货场",
    "region": "旧城连锁",
    "brief": "拆除2处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "steps": 5,
    "pay": 75,
    "objects": [
      {
        "id": "west-gate",
        "x": 1,
        "kind": "gate"
      },
      {
        "id": "powder",
        "x": 2,
        "kind": "barrel"
      },
      {
        "id": "west-tower",
        "x": 3,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "cargo",
        "x": 4,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "east-tower",
        "x": 5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "vault",
        "x": 6,
        "kind": "vault"
      }
    ],
    "goals": [
      "west-gate",
      "east-tower"
    ],
    "protect": [
      "cargo",
      "vault"
    ],
    "extension": {
      "x": 4.5
    },
    "chapter": 1,
    "revision": 1
  },
  {
    "id": "structural-29",
    "title": "高塔货栈",
    "objects": [
      {
        "id": "gate",
        "x": 1,
        "kind": "gate"
      },
      {
        "id": "fuse",
        "x": 2,
        "kind": "barrel"
      },
      {
        "id": "start",
        "x": 3,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "cargo",
        "x": 4,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "bell",
        "x": 5.4,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "safe",
        "x": 6.5,
        "kind": "vault"
      }
    ],
    "goals": [
      "gate",
      "bell"
    ],
    "protect": [
      "cargo",
      "safe"
    ],
    "brief": "拆除2处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 4,
    "pay": 100,
    "plugs": [],
    "chapter": 1,
    "region": "旧城连锁"
  },
  {
    "id": "castle-three-waves",
    "title": "三轮清场",
    "region": "旧城连锁",
    "brief": "拆除3处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "steps": 8,
    "pay": 125,
    "objects": [
      {
        "id": "vault",
        "x": 1,
        "kind": "vault"
      },
      {
        "id": "west-powder",
        "x": 2,
        "kind": "barrel"
      },
      {
        "id": "west-tower",
        "x": 3,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "west-cargo",
        "x": 4,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "middle-tower",
        "x": 5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "relay",
        "x": 6,
        "kind": "tower",
        "feet": {
          "left": false,
          "right": false
        },
        "name": "石脚塔"
      },
      {
        "id": "east-cargo",
        "x": 7,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "east-powder",
        "x": 8,
        "kind": "barrel"
      },
      {
        "id": "gate",
        "x": 9,
        "kind": "gate"
      },
      {
        "id": "east-tower",
        "x": 10,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": false
        }
      }
    ],
    "goals": [
      "vault",
      "relay",
      "gate"
    ],
    "protect": [
      "west-cargo",
      "east-cargo"
    ],
    "extension": {
      "x": 8.65
    },
    "chapter": 1,
    "revision": 1
  },
  {
    "id": "deep-iron-triple",
    "title": "三击过关",
    "brief": "拆除2处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "steps": 8,
    "pay": 150,
    "objects": [
      {
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        },
        "id": "yard-entry"
      },
      {
        "x": 2,
        "kind": "cargo",
        "braceSlot": true,
        "id": "yard-near"
      },
      {
        "x": 3,
        "kind": "iron",
        "armor": 3,
        "id": "yard-heavy"
      },
      {
        "x": 4,
        "kind": "barrel",
        "id": "yard-barrel"
      },
      {
        "x": 5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        },
        "id": "yard-middle"
      },
      {
        "x": 6,
        "kind": "tower",
        "feet": {
          "left": false,
          "right": false
        },
        "id": "yard-relay"
      },
      {
        "x": 7,
        "kind": "iron",
        "armor": 2,
        "id": "yard-door"
      },
      {
        "x": 8,
        "kind": "cargo",
        "braceSlot": true,
        "id": "yard-far"
      },
      {
        "x": 9,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        },
        "id": "yard-finish"
      }
    ],
    "plugs": [
      {
        "x": 4.45,
        "id": "plug-1"
      }
    ],
    "advanced": true,
    "region": "旧城连锁",
    "goals": [
      "yard-heavy",
      "yard-door"
    ],
    "protect": [
      "yard-near",
      "yard-far"
    ],
    "chapter": 1,
    "revision": 2
  },
  {
    "id": "structural-22",
    "title": "旧墙货场",
    "objects": [
      {
        "id": "bell",
        "x": 1.5,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "fuse",
        "x": 2.5,
        "kind": "barrel"
      },
      {
        "id": "wall",
        "x": 3.5,
        "kind": "bulwark",
        "armor": 1
      },
      {
        "id": "cargo",
        "x": 4.3,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "finish",
        "x": 5.5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "safe",
        "x": 6.5,
        "kind": "vault"
      }
    ],
    "goals": [
      "wall",
      "finish",
      "fuse"
    ],
    "protect": [
      "cargo",
      "safe"
    ],
    "brief": "拆除3处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 3,
    "pay": 175,
    "plugs": [],
    "chapter": 2,
    "region": "承台与掩体"
  },
  {
    "id": "structural-25",
    "title": "同一座石拱",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "deck",
        "x": 2.8,
        "kind": "bridge",
        "span": 2.8,
        "armor": 2,
        "row": 0
      },
      {
        "id": "house",
        "x": 2.8,
        "kind": "cottage",
        "row": 1
      },
      {
        "id": "cargo",
        "x": 4.4,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "bell",
        "x": 5.8,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      }
    ],
    "goals": [
      "house",
      "bell"
    ],
    "protect": [
      "cargo"
    ],
    "brief": "拆除2处靶标目标，保全1处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 3,
    "pay": 200,
    "plugs": [],
    "chapter": 2,
    "region": "承台与掩体"
  },
  {
    "id": "structural-26",
    "title": "重门工地",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "deck",
        "x": 2.6,
        "kind": "platform",
        "span": 2.2,
        "armor": 1,
        "row": 0
      },
      {
        "id": "fuse",
        "x": 2.6,
        "kind": "barrel",
        "row": 1
      },
      {
        "id": "door",
        "x": 2.9,
        "kind": "iron",
        "armor": 4
      },
      {
        "id": "cargo",
        "x": 3.8,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "gate",
        "x": 4.4,
        "kind": "gate"
      },
      {
        "id": "bell",
        "x": 5.5,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "safe",
        "x": 6.8,
        "kind": "vault"
      }
    ],
    "goals": [
      "door",
      "gate"
    ],
    "protect": [
      "cargo",
      "safe"
    ],
    "brief": "拆除2处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 4,
    "pay": 225,
    "plugs": [],
    "chapter": 2,
    "region": "承台与掩体"
  },
  {
    "id": "structural-30",
    "title": "拱上火药",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "deck",
        "x": 3,
        "kind": "bridge",
        "span": 1.8,
        "armor": 2,
        "row": 0
      },
      {
        "id": "factory",
        "x": 3,
        "kind": "powderhouse",
        "row": 1
      },
      {
        "id": "cargo",
        "x": 4.6,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "bell",
        "x": 5.5,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "safe",
        "x": 6.8,
        "kind": "vault"
      }
    ],
    "goals": [
      "factory",
      "bell"
    ],
    "protect": [
      "cargo",
      "safe"
    ],
    "brief": "拆除2处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 4,
    "pay": 250,
    "plugs": [],
    "chapter": 2,
    "region": "承台与掩体"
  },
  {
    "id": "structural-27",
    "title": "楼里的滚石",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "lower",
        "x": 3,
        "kind": "platform",
        "span": 3.2,
        "armor": 1,
        "row": 0
      },
      {
        "id": "upper",
        "x": 3,
        "kind": "platform",
        "span": 2.4,
        "armor": 1,
        "row": 1
      },
      {
        "id": "vault",
        "x": 3,
        "kind": "vault",
        "row": 2
      },
      {
        "id": "fuse",
        "x": 4,
        "kind": "barrel",
        "row": 1
      },
      {
        "id": "cargo",
        "x": 4.8,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "rock",
        "x": 5.5,
        "kind": "boulder"
      },
      {
        "id": "wall",
        "x": 6.2,
        "kind": "bulwark",
        "armor": 1
      },
      {
        "id": "middle",
        "x": 7.8,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "door",
        "x": 9.1,
        "kind": "gate"
      },
      {
        "id": "safe",
        "x": 9.8,
        "kind": "vault"
      }
    ],
    "goals": [
      "vault",
      "wall",
      "door"
    ],
    "protect": [
      "cargo",
      "safe"
    ],
    "brief": "拆除3处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 3,
    "pay": 275,
    "plugs": [],
    "chapter": 2,
    "region": "承台与掩体"
  },
  {
    "id": "structural-37",
    "title": "石拱下的接力",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "deck",
        "x": 2.7,
        "kind": "bridge",
        "span": 2.4,
        "armor": 2,
        "row": 0
      },
      {
        "id": "house",
        "x": 2.5,
        "kind": "cottage",
        "row": 1
      },
      {
        "id": "fuse",
        "x": 3,
        "kind": "barrel"
      },
      {
        "id": "middle",
        "x": 4.6,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "cargo",
        "x": 5.8,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "rock",
        "x": 6.6,
        "kind": "boulder"
      },
      {
        "id": "gate",
        "x": 10.2,
        "kind": "gate"
      }
    ],
    "goals": [
      "house",
      "gate"
    ],
    "protect": [
      "cargo"
    ],
    "brief": "拆除2处靶标目标，保全1处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 2,
    "pay": 300,
    "plugs": [],
    "chapter": 3,
    "region": "滚道与借力"
  },
  {
    "id": "structural-31",
    "title": "矿道石阵",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "cargo",
        "x": 1.8,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "rock",
        "x": 2.5,
        "kind": "boulder"
      },
      {
        "id": "wall",
        "x": 3.5,
        "kind": "bulwark",
        "armor": 1
      },
      {
        "id": "middle",
        "x": 5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "gate",
        "x": 6.3,
        "kind": "gate"
      },
      {
        "id": "safe",
        "x": 7,
        "kind": "vault"
      }
    ],
    "goals": [
      "wall",
      "gate"
    ],
    "protect": [
      "cargo",
      "safe"
    ],
    "brief": "拆除2处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 3,
    "pay": 325,
    "plugs": [],
    "chapter": 3,
    "region": "滚道与借力"
  },
  {
    "id": "structural-33",
    "title": "双墙滚道",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "first",
        "x": 2.5,
        "kind": "boulder"
      },
      {
        "id": "near",
        "x": 3.5,
        "kind": "bulwark",
        "armor": 1
      },
      {
        "id": "middle",
        "x": 5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": false
        }
      },
      {
        "id": "second",
        "x": 5.8,
        "kind": "boulder"
      },
      {
        "id": "far",
        "x": 7,
        "kind": "bulwark",
        "armor": 1
      },
      {
        "id": "finish",
        "x": 8.5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "gate",
        "x": 9.6,
        "kind": "gate"
      },
      {
        "id": "safe",
        "x": 10.5,
        "kind": "vault"
      }
    ],
    "goals": [
      "near",
      "far",
      "gate"
    ],
    "protect": [
      "safe"
    ],
    "brief": "拆除3处靶标目标，保全1处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 3,
    "pay": 350,
    "plugs": [],
    "chapter": 3,
    "region": "滚道与借力"
  },
  {
    "id": "structural-34",
    "title": "钟楼与滚石",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "rock",
        "x": 2.5,
        "kind": "boulder"
      },
      {
        "id": "door",
        "x": 4,
        "kind": "iron",
        "armor": 3
      },
      {
        "id": "factory",
        "x": 5.4,
        "kind": "powderhouse"
      },
      {
        "id": "bell",
        "x": 7,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "cargo",
        "x": 8.3,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "safe",
        "x": 10,
        "kind": "vault"
      }
    ],
    "goals": [
      "door",
      "factory"
    ],
    "protect": [
      "cargo",
      "safe"
    ],
    "brief": "拆除2处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 3,
    "pay": 375,
    "plugs": [],
    "chapter": 3,
    "region": "滚道与借力"
  },
  {
    "id": "structural-38",
    "title": "重墙货栈",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "rock",
        "x": 2.5,
        "kind": "boulder"
      },
      {
        "id": "near",
        "x": 3.5,
        "kind": "bulwark",
        "armor": 1
      },
      {
        "id": "middle",
        "x": 5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "fuse",
        "x": 6.3,
        "kind": "barrel"
      },
      {
        "id": "door",
        "x": 7.8,
        "kind": "iron",
        "armor": 2
      },
      {
        "id": "cargo",
        "x": 7,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "finish",
        "x": 9.6,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "safe",
        "x": 10.8,
        "kind": "vault"
      }
    ],
    "goals": [
      "near",
      "door"
    ],
    "protect": [
      "cargo",
      "safe"
    ],
    "brief": "拆除2处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 3,
    "previousBudget": {
      "layoutRevision": 2,
      "steps": 4
    },
    "steps": 5,
    "pay": 400,
    "plugs": [],
    "chapter": 3,
    "region": "滚道与借力"
  },
  {
    "id": "structural-41",
    "title": "水火交界",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "fuse",
        "x": 2.5,
        "kind": "barrel"
      },
      {
        "id": "cargo",
        "x": 3.2,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "door",
        "x": 4,
        "kind": "iron",
        "armor": 2
      },
      {
        "id": "spring",
        "x": 4.3,
        "kind": "spring"
      },
      {
        "id": "finish",
        "x": 5.5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "safe",
        "x": 7,
        "kind": "vault"
      }
    ],
    "goals": [
      "door"
    ],
    "protect": [
      "cargo",
      "safe"
    ],
    "brief": "拆除1处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 3,
    "pay": 425,
    "plugs": [],
    "chapter": 4,
    "region": "水火先后"
  },
  {
    "id": "structural-42",
    "title": "水塔承台",
    "objects": [
      {
        "id": "water",
        "x": 1.5,
        "kind": "watertower"
      },
      {
        "id": "cargo",
        "x": 2.4,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "middle",
        "x": 3.2,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "deck",
        "x": 4.4,
        "kind": "platform",
        "span": 1.4,
        "armor": 1,
        "row": 0
      },
      {
        "id": "factory",
        "x": 4.4,
        "kind": "powderhouse",
        "row": 1
      },
      {
        "id": "farCargo",
        "x": 5.2,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "bell",
        "x": 6.9,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      }
    ],
    "goals": [
      "factory",
      "bell"
    ],
    "protect": [
      "cargo",
      "farCargo"
    ],
    "brief": "拆除2处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 4,
    "pay": 450,
    "plugs": [],
    "chapter": 4,
    "region": "水火先后"
  },
  {
    "id": "structural-45",
    "title": "滚道水闸",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "rock",
        "x": 2.5,
        "kind": "boulder"
      },
      {
        "id": "wall",
        "x": 3.5,
        "kind": "bulwark",
        "armor": 1
      },
      {
        "id": "middle",
        "x": 5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "water",
        "x": 6.3,
        "kind": "watertower"
      },
      {
        "id": "factory",
        "x": 7.7,
        "kind": "powderhouse"
      },
      {
        "id": "cargo",
        "x": 8.8,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "finish",
        "x": 9.5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      }
    ],
    "goals": [
      "wall",
      "factory",
      "finish"
    ],
    "protect": [
      "cargo"
    ],
    "brief": "拆除3处靶标目标，保全1处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 4,
    "pay": 475,
    "plugs": [],
    "chapter": 4,
    "region": "水火先后"
  },
  {
    "id": "structural-43",
    "title": "火药街",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "dry",
        "x": 2.5,
        "kind": "barrel"
      },
      {
        "id": "near",
        "x": 3.2,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "door",
        "x": 4,
        "kind": "iron",
        "armor": 2
      },
      {
        "id": "water",
        "x": 4.8,
        "kind": "watertower"
      },
      {
        "id": "middle",
        "x": 5.5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "wet",
        "x": 6.5,
        "kind": "barrel"
      },
      {
        "id": "far",
        "x": 7.5,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "gate",
        "x": 8.3,
        "kind": "gate"
      },
      {
        "id": "bell",
        "x": 9,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      }
    ],
    "goals": [
      "door",
      "gate"
    ],
    "protect": [
      "near",
      "far"
    ],
    "brief": "拆除2处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 5,
    "pay": 500,
    "plugs": [],
    "chapter": 4,
    "region": "水火先后"
  },
  {
    "id": "structural-46",
    "title": "双台水渠",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "fireDeck",
        "x": 2.6,
        "kind": "platform",
        "span": 2.4,
        "armor": 1,
        "row": 0
      },
      {
        "id": "dry",
        "x": 2.8,
        "kind": "barrel",
        "row": 1
      },
      {
        "id": "door",
        "x": 4.3,
        "kind": "iron",
        "armor": 2
      },
      {
        "id": "near",
        "x": 3.5,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "water",
        "x": 5.1,
        "kind": "watertower"
      },
      {
        "id": "middle",
        "x": 5.9,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "gate",
        "x": 7.2,
        "kind": "gate"
      },
      {
        "id": "wet",
        "x": 8.1,
        "kind": "barrel"
      },
      {
        "id": "far",
        "x": 9,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "bell",
        "x": 10,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      }
    ],
    "goals": [
      "door",
      "gate",
      "wet"
    ],
    "protect": [
      "near",
      "far"
    ],
    "brief": "拆除3处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 5,
    "pay": 525,
    "plugs": [],
    "chapter": 4,
    "region": "水火先后"
  },
  {
    "id": "structural-32",
    "title": "两层石楼",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "cargo",
        "x": 1.8,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "rock",
        "x": 2.5,
        "kind": "boulder"
      },
      {
        "id": "wall",
        "x": 3.5,
        "kind": "bulwark",
        "armor": 1
      },
      {
        "id": "middle",
        "x": 5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "lower",
        "x": 6.3,
        "kind": "platform",
        "span": 1.6,
        "armor": 1,
        "row": 0
      },
      {
        "id": "upper",
        "x": 6.3,
        "kind": "platform",
        "span": 1.6,
        "armor": 1,
        "row": 1
      },
      {
        "id": "vault",
        "x": 6.3,
        "kind": "vault",
        "row": 2
      },
      {
        "id": "door",
        "x": 6.5,
        "kind": "iron",
        "armor": 2
      },
      {
        "id": "safe",
        "x": 7,
        "kind": "vault"
      }
    ],
    "goals": [
      "wall",
      "vault",
      "door"
    ],
    "protect": [
      "cargo",
      "safe"
    ],
    "brief": "拆除3处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 3,
    "pay": 550,
    "plugs": [],
    "chapter": 5,
    "region": "全局拆解"
  },
  {
    "id": "structural-36",
    "title": "两塔一门",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "rock",
        "x": 2.5,
        "kind": "boulder"
      },
      {
        "id": "wall",
        "x": 3.5,
        "kind": "bulwark",
        "armor": 1
      },
      {
        "id": "middle",
        "x": 5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": false
        }
      },
      {
        "id": "door",
        "x": 6.3,
        "kind": "iron",
        "armor": 2
      },
      {
        "id": "return",
        "x": 8.5,
        "kind": "boulder"
      },
      {
        "id": "finish",
        "x": 10,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "cargo",
        "x": 9.2,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "safe",
        "x": 11,
        "kind": "vault"
      }
    ],
    "goals": [
      "wall",
      "door"
    ],
    "protect": [
      "cargo",
      "safe"
    ],
    "brief": "拆除2处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 4,
    "pay": 575,
    "plugs": [],
    "chapter": 5,
    "region": "全局拆解"
  },
  {
    "id": "structural-48",
    "title": "三塔重门",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "cargo",
        "x": 1.8,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "rock",
        "x": 2.5,
        "kind": "boulder"
      },
      {
        "id": "wall",
        "x": 3.5,
        "kind": "bulwark",
        "armor": 1
      },
      {
        "id": "middle",
        "x": 5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": false
        }
      },
      {
        "id": "door",
        "x": 6.3,
        "kind": "iron",
        "armor": 3
      },
      {
        "id": "fuse",
        "x": 7.4,
        "kind": "barrel"
      },
      {
        "id": "bell",
        "x": 8.5,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "safe",
        "x": 9.8,
        "kind": "vault"
      }
    ],
    "goals": [
      "wall",
      "door"
    ],
    "protect": [
      "cargo",
      "safe"
    ],
    "brief": "拆除2处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 4,
    "pay": 600,
    "plugs": [],
    "chapter": 5,
    "region": "全局拆解"
  },
  {
    "id": "structural-44",
    "title": "旧码头",
    "objects": [
      {
        "id": "start",
        "x": 1,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "dry",
        "x": 2.5,
        "kind": "barrel"
      },
      {
        "id": "near",
        "x": 3.2,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "door",
        "x": 4,
        "kind": "iron",
        "armor": 2
      },
      {
        "id": "water",
        "x": 4.8,
        "kind": "watertower"
      },
      {
        "id": "middle",
        "x": 5.5,
        "kind": "tower",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "deck",
        "x": 7.2,
        "kind": "platform",
        "span": 1.8,
        "armor": 1,
        "row": 0
      },
      {
        "id": "factory",
        "x": 7.2,
        "kind": "powderhouse",
        "row": 1
      },
      {
        "id": "far",
        "x": 8.8,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "bell",
        "x": 9.5,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      }
    ],
    "goals": [
      "door",
      "factory",
      "bell"
    ],
    "protect": [
      "near",
      "far"
    ],
    "brief": "拆除3处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 5,
    "pay": 625,
    "plugs": [],
    "chapter": 5,
    "region": "全局拆解"
  },
  {
    "id": "structural-50",
    "title": "最后一座旧城",
    "objects": [
      {
        "id": "start",
        "x": 1.5,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "under",
        "x": 3.3,
        "kind": "barrel"
      },
      {
        "id": "fireDeck",
        "x": 3.7,
        "kind": "bridge",
        "span": 3,
        "armor": 2,
        "row": 0
      },
      {
        "id": "dry",
        "x": 4.2,
        "kind": "barrel",
        "row": 1
      },
      {
        "id": "door",
        "x": 5.2,
        "kind": "iron",
        "armor": 3
      },
      {
        "id": "near",
        "x": 5.9,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "water",
        "x": 7.1,
        "kind": "watertower"
      },
      {
        "id": "middle",
        "x": 8.1,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      },
      {
        "id": "roof",
        "x": 9.6,
        "kind": "platform",
        "span": 1.8,
        "armor": 1,
        "row": 0
      },
      {
        "id": "factory",
        "x": 9.6,
        "kind": "powderhouse",
        "row": 1
      },
      {
        "id": "far",
        "x": 10.9,
        "kind": "cargo",
        "braceSlot": true
      },
      {
        "id": "finish",
        "x": 11.9,
        "kind": "bellhouse",
        "feet": {
          "left": true,
          "right": true
        }
      }
    ],
    "goals": [
      "door",
      "dry",
      "factory"
    ],
    "protect": [
      "near",
      "far"
    ],
    "brief": "拆除3处靶标目标，保全2处盾牌物件。其余物件可自行取舍。",
    "advanced": true,
    "revision": 2,
    "steps": 6,
    "pay": 650,
    "plugs": [],
    "chapter": 5,
    "region": "全局拆解"
  }
];
