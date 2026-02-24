/**
 * 音效系统
 * 分类：UI / Combat / Card / Ambient
 */

export enum AudioCategory {
  UI = "UI",
  Combat = "Combat",
  Card = "Card",
  Ambient = "Ambient",
}

export enum AudioEvent {
  // UI音效
  UIClick = "UIClick",
  UIHover = "UIHover",
  UIError = "UIError",
  
  // 战斗音效
  Attack = "Attack",
  Damage = "Damage",
  Death = "Death",
  Heal = "Heal",
  
  // 卡牌音效
  CardPlay = "CardPlay",
  CardDraw = "CardDraw",
  CardHover = "CardHover",
  SpellCast = "SpellCast",
  
  // 回合音效
  TurnStart = "TurnStart",
  TurnEnd = "TurnEnd",
  
  // 胜负音效
  Victory = "Victory",
  Defeat = "Defeat",
}

interface AudioConfig {
  src: string;
  volume: number;
  category: AudioCategory;
  loop?: boolean;
}

export class AudioSystem {
  private audioElements: Map<AudioEvent, HTMLAudioElement> = new Map();
  private volumes: Map<AudioCategory, number> = new Map();
  private muted: boolean = false;
  private musicTrack: HTMLAudioElement | null = null;

  constructor() {
    // 初始化音量设置
    this.volumes.set(AudioCategory.UI, 0.6);
    this.volumes.set(AudioCategory.Combat, 0.8);
    this.volumes.set(AudioCategory.Card, 0.7);
    this.volumes.set(AudioCategory.Ambient, 0.4);

    // 预加载音效（实际项目中应该从资源服务器加载）
    this.initAudioLibrary();
  }

  /**
   * 初始化音效库
   */
  private initAudioLibrary() {
    const audioLibrary: Record<AudioEvent, AudioConfig> = {
      // UI音效（使用Web Audio API生成的简单音效，实际项目应使用真实音频文件）
      [AudioEvent.UIClick]: {
        src: this.generateBeepSound(800, 0.1),
        volume: 0.6,
        category: AudioCategory.UI,
      },
      [AudioEvent.UIHover]: {
        src: this.generateBeepSound(600, 0.05),
        volume: 0.3,
        category: AudioCategory.UI,
      },
      [AudioEvent.UIError]: {
        src: this.generateBeepSound(300, 0.2),
        volume: 0.7,
        category: AudioCategory.UI,
      },
      
      // 战斗音效
      [AudioEvent.Attack]: {
        src: this.generateBeepSound(400, 0.15),
        volume: 0.8,
        category: AudioCategory.Combat,
      },
      [AudioEvent.Damage]: {
        src: this.generateBeepSound(200, 0.2),
        volume: 0.9,
        category: AudioCategory.Combat,
      },
      [AudioEvent.Death]: {
        src: this.generateBeepSound(150, 0.3),
        volume: 0.8,
        category: AudioCategory.Combat,
      },
      [AudioEvent.Heal]: {
        src: this.generateBeepSound(900, 0.2),
        volume: 0.7,
        category: AudioCategory.Combat,
      },
      
      // 卡牌音效
      [AudioEvent.CardPlay]: {
        src: this.generateBeepSound(700, 0.15),
        volume: 0.7,
        category: AudioCategory.Card,
      },
      [AudioEvent.CardDraw]: {
        src: this.generateBeepSound(1000, 0.1),
        volume: 0.6,
        category: AudioCategory.Card,
      },
      [AudioEvent.CardHover]: {
        src: this.generateBeepSound(500, 0.05),
        volume: 0.4,
        category: AudioCategory.Card,
      },
      [AudioEvent.SpellCast]: {
        src: this.generateBeepSound(1200, 0.25),
        volume: 0.8,
        category: AudioCategory.Card,
      },
      
      // 回合音效
      [AudioEvent.TurnStart]: {
        src: this.generateBeepSound(850, 0.2),
        volume: 0.7,
        category: AudioCategory.UI,
      },
      [AudioEvent.TurnEnd]: {
        src: this.generateBeepSound(650, 0.2),
        volume: 0.7,
        category: AudioCategory.UI,
      },
      
      // 胜负音效
      [AudioEvent.Victory]: {
        src: this.generateBeepSound(1500, 0.5),
        volume: 1.0,
        category: AudioCategory.UI,
      },
      [AudioEvent.Defeat]: {
        src: this.generateBeepSound(100, 0.5),
        volume: 1.0,
        category: AudioCategory.UI,
      },
    };

    // 创建音频元素
    Object.entries(audioLibrary).forEach(([event, config]) => {
      const audio = new Audio(config.src);
      audio.volume = config.volume * (this.volumes.get(config.category) || 1);
      if (config.loop) {
        audio.loop = true;
      }
      this.audioElements.set(event as AudioEvent, audio);
    });
  }

  /**
   * 生成简单的提示音（用于原型，实际项目应使用真实音频文件）
   */
  private generateBeepSound(frequency: number, duration: number): string {
    // 返回空的data URL，实际应该生成真实的音频
    // 在真实项目中，这里应该返回音频文件的URL
    return "";
  }

  /**
   * 播放音效
   */
  play(event: AudioEvent) {
    if (this.muted) return;

    const audio = this.audioElements.get(event);
    if (audio) {
      // 重置播放位置
      audio.currentTime = 0;
      
      // 播放音效（忽略错误，因为我们使用的是占位符）
      audio.play().catch(() => {
        // 静默失败，因为我们没有真实的音频文件
      });
    }
  }

  /**
   * 停止音效
   */
  stop(event: AudioEvent) {
    const audio = this.audioElements.get(event);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * 播放背景音乐
   */
  playMusic(src: string) {
    if (this.musicTrack) {
      this.musicTrack.pause();
    }

    this.musicTrack = new Audio(src);
    this.musicTrack.loop = true;
    this.musicTrack.volume = this.volumes.get(AudioCategory.Ambient) || 0.4;
    
    if (!this.muted) {
      this.musicTrack.play().catch(() => {});
    }
  }

  /**
   * 停止背景音乐
   */
  stopMusic() {
    if (this.musicTrack) {
      this.musicTrack.pause();
      this.musicTrack = null;
    }
  }

  /**
   * 设置音量
   */
  setVolume(category: AudioCategory, volume: number) {
    this.volumes.set(category, volume);
    
    // 更新所有该分类的音效音量
    this.audioElements.forEach((audio, event) => {
      const config = this.getAudioConfig(event);
      if (config && config.category === category) {
        audio.volume = config.volume * volume;
      }
    });

    // 更新背景音乐音量
    if (category === AudioCategory.Ambient && this.musicTrack) {
      this.musicTrack.volume = volume;
    }
  }

  /**
   * 静音/取消静音
   */
  toggleMute() {
    this.muted = !this.muted;
    
    if (this.muted) {
      if (this.musicTrack) {
        this.musicTrack.pause();
      }
    } else {
      if (this.musicTrack) {
        this.musicTrack.play().catch(() => {});
      }
    }
  }

  /**
   * 获取音频配置
   */
  private getAudioConfig(event: AudioEvent): AudioConfig | null {
    // 简化实现
    return null;
  }

  /**
   * 销毁
   */
  destroy() {
    this.audioElements.forEach((audio) => {
      audio.pause();
    });
    this.audioElements.clear();
    
    if (this.musicTrack) {
      this.musicTrack.pause();
      this.musicTrack = null;
    }
  }
}

// 全局音效系统实例
export const audioSystem = new AudioSystem();
