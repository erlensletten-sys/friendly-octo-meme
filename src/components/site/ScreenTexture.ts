"use client";

import * as THREE from "three";
import { bootLines, brand } from "@/lib/site/content";

export const SCREEN_W = 960;
export const SCREEN_H = 540;

const COMMAND = `boot --system=${brand.name.toLowerCase().replace(/\s+/g, "-")}`;

/**
 * Terminalen som vises på skjermen i introen tegnes på et 2D-lerret og brukes
 * som tekstur på skjermflaten. Da ligger den inne i 3D-scenen - hetta kan
 * skygge for den, bloom får den til å lyse, og kameraet kan kjøre helt inn.
 */
export class ScreenTexture {
  readonly texture: THREE.CanvasTexture;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private lastKey = "";

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = SCREEN_W;
    this.canvas.height = SCREEN_H;
    this.ctx = this.canvas.getContext("2d")!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.draw(0, 0, 0);
  }

  /**
   * @param typedChars hvor mange tegn av kommandoen som er skrevet
   * @param lines hvor mange statuslinjer som er kommet
   * @param time sekunder, til markørblink og skannelinje
   */
  draw(typedChars: number, lines: number, time: number) {
    const key = `${typedChars}|${lines}|${Math.floor(time * 2)}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    const c = this.ctx;
    const mono = getMonoFont();

    // Bakgrunn med svak vignett.
    const bg = c.createRadialGradient(SCREEN_W / 2, SCREEN_H / 2, 80, SCREEN_W / 2, SCREEN_H / 2, 700);
    bg.addColorStop(0, "#0b1016");
    bg.addColorStop(1, "#05070a");
    c.fillStyle = bg;
    c.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Vindusramme.
    const x = 72, y = 96, w = SCREEN_W - 144, h = SCREEN_H - 192;
    c.fillStyle = "rgba(13,17,25,0.92)";
    roundRect(c, x, y, w, h, 14);
    c.fill();
    c.strokeStyle = "rgba(62,240,220,0.35)";
    c.lineWidth = 2;
    roundRect(c, x, y, w, h, 14);
    c.stroke();
    c.fillStyle = "rgba(8,11,17,0.9)";
    c.fillRect(x + 1, y + 1, w - 2, 40);
    for (let i = 0; i < 3; i++) {
      c.fillStyle = "#273040";
      c.beginPath();
      c.arc(x + 22 + i * 18, y + 21, 5, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = "#7c8796";
    c.font = `500 15px ${mono}`;
    c.fillText(`${brand.shell}@web: ~`, x + 84, y + 26);

    const blink = Math.floor(time * 2) % 2 === 0;

    // Siste fase: skjermen er ryddet, og navnet står alene midt i vinduet.
    // Det er dette kameraet stuper inn i, så det må tåle å fylle hele bildet.
    if (lines > bootLines.length) {
      c.font = `600 38px ${mono}`;
      const nameW = c.measureText(brand.name).width;
      const nx = x + (w - nameW) / 2;
      const ny = y + 40 + (h - 40) / 2 + 14;
      c.fillStyle = "#8b5cf6";
      c.fillText(">", nx - 40, ny);
      c.fillStyle = "#e8ebf0";
      c.fillText(brand.name, nx, ny);
      if (blink) {
        c.fillStyle = "#3ef0dc";
        c.fillRect(nx + nameW + 10, ny - 31, 18, 38);
      }
      this.finish(c);
      return;
    }

    // Innhold.
    const lineH = 30;
    let cy = y + 84;
    c.font = `500 19px ${mono}`;

    c.fillStyle = "#3ef0dc";
    c.fillText("$", x + 28, cy);
    c.fillStyle = "#e8ebf0";
    const typed = COMMAND.slice(0, typedChars);
    c.fillText(typed, x + 52, cy);
    if (typedChars < COMMAND.length && blink) {
      const tw = c.measureText(typed).width;
      c.fillStyle = "#3ef0dc";
      c.fillRect(x + 56 + tw, cy - 17, 11, 21);
    }
    cy += lineH + 6;

    for (let i = 0; i < Math.min(lines, bootLines.length); i++) {
      const line = bootLines[i];
      c.fillStyle = "#3ef0dc";
      c.fillText("[ ok ]", x + 28, cy);
      c.fillStyle = "#9aa4b2";
      c.fillText(line.label, x + 110, cy);
      c.fillStyle = "#7c8796";
      c.fillText(line.value, x + 290, cy);
      cy += lineH;
    }

    if (lines >= bootLines.length) {
      cy += 8;
      c.fillStyle = "#8b5cf6";
      c.fillText(">", x + 28, cy);
      c.fillStyle = "#e8ebf0";
      c.font = `600 21px ${mono}`;
      c.fillText(brand.name, x + 52, cy);
      if (blink) {
        const tw = c.measureText(brand.name).width;
        c.fillStyle = "#3ef0dc";
        c.fillRect(x + 58 + tw, cy - 18, 11, 22);
      }
    }

    this.finish(c);
  }

  /** Skannelinjer som på et ekte rør, og beskjed til three om at bildet er nytt. */
  private finish(c: CanvasRenderingContext2D) {
    c.fillStyle = "rgba(255,255,255,0.035)";
    for (let sy = 0; sy < SCREEN_H; sy += 4) c.fillRect(0, sy, SCREEN_W, 1);
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function getMonoFont(): string {
  try {
    const face = getComputedStyle(document.documentElement).getPropertyValue("--font-mono-face").trim();
    return face ? `${face}, ui-monospace, Menlo, monospace` : "ui-monospace, Menlo, monospace";
  } catch {
    return "ui-monospace, Menlo, monospace";
  }
}

export const BOOT_COMMAND_LENGTH = COMMAND.length;
