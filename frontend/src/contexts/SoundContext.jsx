import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const SONS = {
  tap: require('../../assets/sfx/tap.mp3'),
  continuar: require('../../assets/sfx/continuar.mp3'),
  voltar: require('../../assets/sfx/voltar.mp3'),
  alternar: require('../../assets/sfx/alternar.mp3'),
  open: require('../../assets/sfx/open.mp3'),
  close: require('../../assets/sfx/close.mp3'),
  erro: require('../../assets/sfx/erro.mp3'),
  success: require('../../assets/sfx/success.mp3'),
  bonus: require('../../assets/sfx/bonus.mp3'),
  fail: require('../../assets/sfx/fail.mp3'),
  coin: require('../../assets/sfx/coin.mp3'),
  levelUp: require('../../assets/sfx/levelUp.mp3'),
  moldeAgua: require('../../assets/sfx/moldeAgua.mp3'),
  moldeEstudo: require('../../assets/sfx/moldeEstudo.mp3'),
  moldeExercicio: require('../../assets/sfx/moldeExercicio.mp3'),
  moldeBloqueado: require('../../assets/sfx/moldeBloqueado.mp3'),
};

const STORAGE_KEY = 'somMudo';

const SoundContext = createContext();
export const useSfx = () => useContext(SoundContext);

export const SoundProvider = ({ children }) => {
  const [mudo, setMudoState] = useState(false);
  const playersRef = useRef({});
  const mudoRef = useRef(false);

  useEffect(() => {
    mudoRef.current = mudo;
  }, [mudo]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {
    });

    const players = {};
    Object.entries(SONS).forEach(([nome, fonte]) => {
      players[nome] = createAudioPlayer(fonte);
    });
    playersRef.current = players;

    AsyncStorage.getItem(STORAGE_KEY).then((salvo) => {
      if (salvo === 'true') setMudoState(true);
    });

    return () => {
      Object.values(players).forEach((player) => player.remove());
    };
  }, []);

  const tocar = useCallback((nome) => {
    if (mudoRef.current) return;
    const player = playersRef.current[nome];
    if (!player) return;

    try {
      player.seekTo(0);
      player.play();
    } catch {
    }
  }, []);

  const setMudo = useCallback((valor) => {
    setMudoState(valor);
    AsyncStorage.setItem(STORAGE_KEY, valor ? 'true' : 'false');
  }, []);

  return <SoundContext.Provider value={{ tocar, mudo, setMudo }}>{children}</SoundContext.Provider>;
};
