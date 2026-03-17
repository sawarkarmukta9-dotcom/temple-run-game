import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameState, GameStats, PlayerState } from '../types';

interface GameProps {
  gameState: GameState;
  onGameOver: (stats: GameStats) => void;
  onStatsUpdate: (stats: GameStats) => void;
}

const LANE_WIDTH = 3;
const TILE_LENGTH = 20;
const INITIAL_SPEED = 0.2;
const SPEED_INCREMENT = 0.0001;
const MAX_SPEED = 0.6;
const JUMP_FORCE = 0.15;
const GRAVITY = 0.008;

const Game: React.FC<GameProps> = ({ gameState, onGameOver, onStatsUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const tilesRef = useRef<THREE.Group[]>([]);
  const obstaclesRef = useRef<THREE.Mesh[]>([]);
  const coinsRef = useRef<THREE.Mesh[]>([]);
  
  const statsRef = useRef<GameStats>({
    score: 0,
    distance: 0,
    coins: 0,
    speed: INITIAL_SPEED,
  });

  const playerStateRef = useRef<PlayerState>({
    lane: 0,
    isJumping: false,
    isSliding: false,
    y: 0,
    velocity: 0,
  });

  const animationFrameRef = useRef<number | null>(null);

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 10, 100);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Large Ground Plane (for background)
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 }); // Forest green
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Player
    const playerGroup = new THREE.Group();
    const bodyGeometry = new THREE.BoxGeometry(1, 2, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    playerGroup.add(body);
    
    // Head
    const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffccaa });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.3;
    head.castShadow = true;
    playerGroup.add(head);

    scene.add(playerGroup);
    playerRef.current = playerGroup;

    // Initial Tiles
    for (let i = 0; i < 10; i++) {
      createTile(i * -TILE_LENGTH);
    }

    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  const createTile = (z: number) => {
    if (!sceneRef.current) return;

    const tileGroup = new THREE.Group();
    tileGroup.position.z = z;

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(LANE_WIDTH * 3, TILE_LENGTH);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    tileGroup.add(floor);

    // Lane Lines
    const lineGeometry = new THREE.PlaneGeometry(0.1, TILE_LENGTH);
    const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    const line1 = new THREE.Mesh(lineGeometry, lineMaterial);
    line1.rotation.x = -Math.PI / 2;
    line1.position.set(-LANE_WIDTH / 2, 0.01, 0);
    tileGroup.add(line1);

    const line2 = new THREE.Mesh(lineGeometry, lineMaterial);
    line2.rotation.x = -Math.PI / 2;
    line2.position.set(LANE_WIDTH / 2, 0.01, 0);
    tileGroup.add(line2);

    // Side Pillars
    const pillarGeometry = new THREE.BoxGeometry(0.5, 4, 0.5);
    const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    
    for (let i = 0; i < 2; i++) {
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(i === 0 ? -LANE_WIDTH * 1.8 : LANE_WIDTH * 1.8, 2, 0);
      pillar.castShadow = true;
      tileGroup.add(pillar);
    }

    // Obstacles (don't add to first few tiles)
    if (z < -TILE_LENGTH * 2) {
      if (Math.random() > 0.4) {
        const lane = Math.floor(Math.random() * 3) - 1;
        const type = Math.random() > 0.5 ? 'HURDLE' : 'BRANCH';
        
        if (type === 'HURDLE') {
          const hurdleGeometry = new THREE.BoxGeometry(LANE_WIDTH * 0.8, 0.8, 0.5);
          const hurdleMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
          const hurdle = new THREE.Mesh(hurdleGeometry, hurdleMaterial);
          hurdle.position.set(lane * LANE_WIDTH, 0.4, Math.random() * TILE_LENGTH - TILE_LENGTH / 2);
          hurdle.castShadow = true;
          tileGroup.add(hurdle);
          obstaclesRef.current.push(hurdle);
        } else {
          const branchGeometry = new THREE.BoxGeometry(LANE_WIDTH * 0.8, 0.5, 0.5);
          const branchMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
          const branch = new THREE.Mesh(branchGeometry, branchMaterial);
          branch.position.set(lane * LANE_WIDTH, 2.5, Math.random() * TILE_LENGTH - TILE_LENGTH / 2);
          branch.castShadow = true;
          tileGroup.add(branch);
          obstaclesRef.current.push(branch);
        }
      }

      // Coins
      if (Math.random() > 0.3) {
        const lane = Math.floor(Math.random() * 3) - 1;
        const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
        const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        coin.rotation.x = Math.PI / 2;
        coin.position.set(lane * LANE_WIDTH, 1, Math.random() * TILE_LENGTH - TILE_LENGTH / 2);
        tileGroup.add(coin);
        coinsRef.current.push(coin);
      }
    }

    sceneRef.current.add(tileGroup);
    tilesRef.current.push(tileGroup);
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;

      switch (e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          if (playerStateRef.current.lane > -1) playerStateRef.current.lane--;
          break;
        case 'd':
        case 'arrowright':
          if (playerStateRef.current.lane < 1) playerStateRef.current.lane++;
          break;
        case ' ':
        case 'w':
        case 'arrowup':
          if (!playerStateRef.current.isJumping && !playerStateRef.current.isSliding) {
            playerStateRef.current.isJumping = true;
            playerStateRef.current.velocity = JUMP_FORCE;
          }
          break;
        case 's':
        case 'arrowdown':
          if (!playerStateRef.current.isJumping && !playerStateRef.current.isSliding) {
            playerStateRef.current.isSliding = true;
            setTimeout(() => {
              playerStateRef.current.isSliding = false;
            }, 800);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const update = () => {
      if (!playerRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      // Update Speed
      if (statsRef.current.speed < MAX_SPEED) {
        statsRef.current.speed += SPEED_INCREMENT;
      }

      // Update Player Position
      const targetX = playerStateRef.current.lane * LANE_WIDTH;
      playerRef.current.position.x = THREE.MathUtils.lerp(playerRef.current.position.x, targetX, 0.15);

      // Jump Physics
      if (playerStateRef.current.isJumping) {
        playerStateRef.current.y += playerStateRef.current.velocity;
        playerStateRef.current.velocity -= GRAVITY;
        
        if (playerStateRef.current.y <= 0) {
          playerStateRef.current.y = 0;
          playerStateRef.current.isJumping = false;
          playerStateRef.current.velocity = 0;
        }
      }
      playerRef.current.position.y = playerStateRef.current.y;

      // Slide Visuals
      if (playerStateRef.current.isSliding) {
        playerRef.current.scale.y = 0.5;
        playerRef.current.position.y = playerStateRef.current.y - 0.5;
      } else {
        playerRef.current.scale.y = 1;
      }

      // Move Tiles (Environment moves toward player)
      tilesRef.current.forEach((tile, index) => {
        tile.position.z += statsRef.current.speed;

        // Recycle Tiles
        if (tile.position.z > 20) {
          const lastTileZ = tilesRef.current.reduce((min, t) => Math.min(min, t.position.z), 0);
          tile.position.z = lastTileZ - TILE_LENGTH;
          
          // Clear old obstacles/coins in this tile
          const toRemove: THREE.Object3D[] = [];
          tile.children.forEach(child => {
            if (obstaclesRef.current.includes(child as THREE.Mesh) || coinsRef.current.includes(child as THREE.Mesh)) {
              toRemove.push(child);
              // Remove from refs
              obstaclesRef.current = obstaclesRef.current.filter(o => o !== child);
              coinsRef.current = coinsRef.current.filter(c => c !== child);
            }
          });
          toRemove.forEach(child => tile.remove(child));

          // Add new obstacles/coins
          if (Math.random() > 0.4) {
            const lane = Math.floor(Math.random() * 3) - 1;
            const type = Math.random() > 0.5 ? 'HURDLE' : 'BRANCH';
            
            if (type === 'HURDLE') {
              const hurdleGeometry = new THREE.BoxGeometry(LANE_WIDTH * 0.8, 0.8, 0.5);
              const hurdleMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
              const hurdle = new THREE.Mesh(hurdleGeometry, hurdleMaterial);
              hurdle.position.set(lane * LANE_WIDTH, 0.4, Math.random() * TILE_LENGTH - TILE_LENGTH / 2);
              hurdle.castShadow = true;
              tile.add(hurdle);
              obstaclesRef.current.push(hurdle);
            } else {
              const branchGeometry = new THREE.BoxGeometry(LANE_WIDTH * 0.8, 0.5, 0.5);
              const branchMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
              const branch = new THREE.Mesh(branchGeometry, branchMaterial);
              branch.position.set(lane * LANE_WIDTH, 2.5, Math.random() * TILE_LENGTH - TILE_LENGTH / 2);
              branch.castShadow = true;
              tile.add(branch);
              obstaclesRef.current.push(branch);
            }
          }

          if (Math.random() > 0.3) {
            const lane = Math.floor(Math.random() * 3) - 1;
            const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
            const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
            const coin = new THREE.Mesh(coinGeometry, coinMaterial);
            coin.rotation.x = Math.PI / 2;
            coin.position.set(lane * LANE_WIDTH, 1, Math.random() * TILE_LENGTH - TILE_LENGTH / 2);
            tile.add(coin);
            coinsRef.current.push(coin);
          }
        }
      });

      // Update Stats
      statsRef.current.distance += statsRef.current.speed;
      statsRef.current.score = Math.floor(statsRef.current.distance + statsRef.current.coins * 10);
      onStatsUpdate({ ...statsRef.current });

      // Collision Detection
      const playerBox = new THREE.Box3().setFromObject(playerRef.current);
      
      // Obstacles
      for (const obstacle of obstaclesRef.current) {
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        if (playerBox.intersectsBox(obstacleBox)) {
          onGameOver({ ...statsRef.current });
          return;
        }
      }

      // Coins
      for (let i = coinsRef.current.length - 1; i >= 0; i--) {
        const coin = coinsRef.current[i];
        const coinBox = new THREE.Box3().setFromObject(coin);
        if (playerBox.intersectsBox(coinBox)) {
          statsRef.current.coins++;
          coin.parent?.remove(coin);
          coinsRef.current.splice(i, 1);
        }
        // Rotate coins
        coin.rotation.z += 0.05;
      }

      // Camera Follow (slight shake or tilt could be added)
      cameraRef.current.position.x = THREE.MathUtils.lerp(cameraRef.current.position.x, playerRef.current.position.x * 0.5, 0.05);

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationFrameRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, onGameOver, onStatsUpdate]);

  // Reset Game
  useEffect(() => {
    if (gameState === 'START') {
      statsRef.current = {
        score: 0,
        distance: 0,
        coins: 0,
        speed: INITIAL_SPEED,
      };
      playerStateRef.current = {
        lane: 0,
        isJumping: false,
        isSliding: false,
        y: 0,
        velocity: 0,
      };
      if (playerRef.current) {
        playerRef.current.position.set(0, 0, 0);
        playerRef.current.scale.set(1, 1, 1);
      }
      // Reset tiles
      tilesRef.current.forEach((tile, i) => {
        tile.position.z = i * -TILE_LENGTH;
        // Clear obstacles/coins
        const toRemove: THREE.Object3D[] = [];
        tile.children.forEach(child => {
          if (obstaclesRef.current.includes(child as THREE.Mesh) || coinsRef.current.includes(child as THREE.Mesh)) {
            toRemove.push(child);
          }
        });
        toRemove.forEach(child => tile.remove(child));
      });
      obstaclesRef.current = [];
      coinsRef.current = [];
    }
  }, [gameState]);

  return <div ref={containerRef} className="w-full h-full overflow-hidden" />;
};

export default Game;
