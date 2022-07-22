import { LinearGradient } from "expo-linear-gradient";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Animated,ScrollView
} from "react-native";
import Slider from "react-native-slider";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState, useRef, memo } from "react";
import { Feather, AntDesign, Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { FontAwesome5, Entypo } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "../Redux/generalSlider";
import { Easing } from "react-native";

function NowPlaying({ navigation, route }) {
  console.log("Nowplaying....");
  const { playID } = route.params;
  const songs = (() => {
    const source_songs = useSelector((state) => state.musics);
    const listSongs = [];
    for (let value of playID) {
      const song = source_songs.find((obj) => obj.id == value);
      if (song) {
        listSongs.push(song);
      }
    }
    return listSongs;
  })();
  
  const [activeRandomBtn, setActiveRandomBtn] = useState(false);
  const [activeRepeatBtn, setActiveRepeatBtn] = useState(false);

  const [openOptionsMenu, setOpenOptionsMenu] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState(songs[currentIndex]);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [isChangeProgress, setIsChangeProgess] = useState(false);

  const [randomNumber, setRandomNumber] = useState();

  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.general);

  const sound = useRef(new Audio.Sound());
  // Handle event when user clicked repeat button
  const handleRepeatSong = () => {
    console.log("<<<");
    if (!activeRepeatBtn) {
      setActiveRepeatBtn(!activeRepeatBtn);
      sound.current.setIsLoopingAsync(true);
    } else {
      setActiveRepeatBtn(!activeRepeatBtn);
      sound.current.setIsLoopingAsync(false);
    }
  };

  // Handle event when user clicked when user clicked random button ==> Set random number and active button
  useEffect(() => {
    console.log("<<<");

    console.log("Use Effect active random");
    if (activeRandomBtn) {
      let randomNumber;
      do {
        randomNumber = Math.floor(Math.random() * songs.length);
      } while (randomNumber === currentIndex);
      setRandomNumber(randomNumber);
    }
  }, [activeRandomBtn]);

  // Handle event when user clicked the next button ==> Set new current index & new current song
  const handleNextSong = () => {
    console.log("<<<");

    if (!activeRandomBtn) {
      if (currentIndex + 1 > songs.length - 1) {
        setCurrentIndex((prevIndex) => {
          setCurrentSong(songs[0]);
          return 0;
        });
      } else {
        setCurrentIndex((prevIndex) => {
          setCurrentSong(songs[prevIndex + 1]);
          return prevIndex + 1;
        });
      }
    } else {
      setCurrentIndex((prevIndex) => {
        setCurrentSong(songs[randomNumber]);
        return randomNumber;
      });
    }
  };

  // Handle event when user clicked the prev button
  const handlePrevSong = () => {
    console.log("<<<");

    if (!activeRandomBtn) {
      if (currentIndex - 1 < 0) {
        setCurrentIndex((prevIndex) => {
          setCurrentSong(songs[songs.length - 1]);
          return songs.length - 1;
        });
      } else {
        setCurrentIndex((prevIndex) => {
          setCurrentSong(songs[currentIndex - 1]);
          return prevIndex - 1;
        });
      }
    } else {
      setCurrentIndex((prevIndex) => {
        setCurrentSong(songs[randomNumber]);
        return randomNumber;
      });
    }
  };
  // Change duration song when user is dragging the slider
  const handleDraggingSlider = (value) => {
    console.log("handle dragging");
    sound.current.getStatusAsync().then((result) => {
      sound.current.setPositionAsync(value * result.durationMillis);
      setIsChangeProgess(false);
    });
  };

  // Handle event when user clicked the play/pause button
  const playSound = () => {
    console.log("Play sound");
    if (!playing) {
      setPlaying(!playing);
      sound.current.playAsync();
    } else {
      setPlaying(!playing);
      sound.current.pauseAsync();
    }
  };

  // stream mode
  // Handle event when current index change ==> Unload old and load new song
  useEffect(() => {
    console.log("test");
    try {
      if (currentSong) {
        sound.current.loadAsync({ uri: currentSong.uri });
      }
      if (playing) {
        sound.current.playAsync();
      }
    } catch {
      console.log("Loading available...");
    }

    return () => {
      return sound.current.unloadAsync();
    };
  }, [currentIndex]);

  // Handle event when user is dragging slider
  sound.current.setOnPlaybackStatusUpdate((onPlaybackStatusUpdate) => {
    let sliderValue =
      Number(
        onPlaybackStatusUpdate.positionMillis /
        onPlaybackStatusUpdate.durationMillis
      ) - "0";
    if (!sliderValue) sliderValue = 0;
    if (!isChangeProgress) {
      setCurrentDuration(sliderValue);
    }
    // Handle event when the current song has been finished ==> Next song or just open random song
    if (onPlaybackStatusUpdate.didJustFinish && !activeRepeatBtn) {
      handleNextSong();
    }
  });
  const renderRightView = (onDeleteHandler) => {
    return (
      <View style={styles.swipe}>
        <TouchableOpacity
          onPress={(e) => {
            setActiveSwipe(!activeSwipe);
          }}
        >
          <View style={styles.ButtonDelete}>
            <View>
              <MaterialIcons
                name="playlist-add"
                size={30}
                color={activeSwipe ? "#1db954" : "#fff"}
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  const stopWhenBack = async () => {
    if (playing) {
      sound.current.unloadAsync().then((resolve) => {
        setPlaying(!playing);
        navigation.navigate("Home");
      });
    } else {
      navigation.goBack();
    }
  };

  // Rotate CD Animation
  let rotateValueHolder = useRef(new Animated.Value(0)).current;

  const rotateData = rotateValueHolder.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    try {
      console.log("Use Effect playing");
      if (playing) {
        Animated.loop(
          Animated.timing(rotateValueHolder, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: true,
            easing: Easing.linear,
            isInteraction: false,
          })
        ).start();
      } else {
        rotateValueHolder.stopAnimation(() => {
          rotateValueHolder.extractOffset();
        });
      }
    } catch (e) {
      console.log(e);
      console.log("Setting CD animated...");
    }
  }, [playing]);

  const handleTheme = () => {
    if (theme == "dark") {
      dispatch(setTheme("light"));
    } else {
      dispatch(setTheme("dark"));
    }
  };

  const handleAdjustVolume = (value) => {
    if (sound.current != null) {
      sound.current.setVolumeAsync(value);
    }
  };

  const handleOpenOptionsMenu = () => {
    setOpenOptionsMenu(!openOptionsMenu);
  };

  return (
    <LinearGradient
      colors={
        theme === "dark" ? ["#2f2b53", "#2f2b53"] : ["#f5f6fd", "#f5f6fd"]
      }
      end={[1, 0.8]}
      style={styles.LinearGradient}
    >
      <View style={styles.pageStatusBar}>
        <TouchableOpacity
          style={styles.iconHeader}
          onPress={stopWhenBack}
        >
          <Ionicons name="ios-chevron-back" size={28} color="white" style={theme === 'light' && styles.blackColor} />
        </TouchableOpacity>
        <Text style={[styles.pageName, theme === 'dark' && styles.whiteColor]}>Musdio</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Sleep")}
          style={styles.sleep}
        >
          <FontAwesome5 name="cloud-moon" size={28} style={[{ position: 'absolute', right: 20, top: "-70%" }, theme === 'light' && styles.blackColor]} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text
          style={[styles.playlistText, theme === "dark" && styles.whiteColor]}
        >
          Playlist
        </Text>
        <Text
          style={[styles.artistName, theme === "dark" && styles.whiteColor]}
        >
          {currentSong.singer}
        </Text>
        <Animated.Image
          style={[styles.cdImage, { transform: [{ rotate: rotateData }] }]}
          source={{ uri: currentSong.img }}
        />
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor="#f3a952"
          maximumTrackTintColor={theme === "dark" ? "#fff" : "#000"}
          thumbTintColor={theme === "dark" ? "#fff" : "#000"}
          value={currentDuration}
          onSlidingStart={() => setIsChangeProgess(true)}
          onSlidingComplete={handleDraggingSlider}
        />
        <Text style={[styles.songName, theme === "dark" && styles.whiteColor]}>
          {currentSong.name}
        </Text>
        <ScrollView style={styles.lyricsBox}>
            <View style={{ flexDirection: 'row', paddingLeft :'10%', paddingRight:'10%'}}>
              <Text style={{ flex: 1, flexWrap: 'wrap', marginVertical:'2%', color:'white'}}>
                  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
              </Text>
            </View>
        </ScrollView>
        <View style={styles.musicControl}>
          <TouchableOpacity
            style={styles.random}
            onPress={() => setActiveRandomBtn(!activeRandomBtn)}
          >
            <FontAwesome
              name="random"
              size={20}
              color={
                activeRandomBtn ? "#1db954" : theme === "dark" ? "#fff" : "#000"
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stepbackward}
            onPress={handlePrevSong}
          >
            <FontAwesome
              name="step-backward"
              size={24}
              color={theme === "dark" ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => setPlaying(!playing)}
          >
            {playing ? (
              <FontAwesome
                name="pause-circle"
                size={80}
                style={styles.playIcon}
                onPress={playSound}
                color={theme === "dark" ? "#fff" : "#000"}
              />
            ) : (
              <FontAwesome
                name="play-circle"
                size={80}
                style={styles.playIcon}
                onPress={playSound}
                color={theme === "dark" ? "#fff" : "#000"}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.stepforward} onPress={handleNextSong}>
            <FontAwesome
              name="step-forward"
              size={24}
              color={theme === "dark" ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.repeat} onPress={handleRepeatSong}>
            <Feather
              name="repeat"
              size={20}
              color={
                activeRepeatBtn ? "#1db954" : theme === "dark" ? "#fff" : "#000"
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.optionsMenu, openOptionsMenu && styles.openMenu]}>
        <TouchableOpacity style={styles.optionsItem}>
          <View style={styles.optionsItemContent}>
            <AntDesign
              name="heart"
              size={24}
              color="white"
              style={styles.optionsItemIcon}
            />
            <Text style={styles.optionsItemText}>Add into favorite list</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionsItem}>
          <View style={styles.optionsItemContent}>
            <AntDesign
              name="clockcircleo"
              size={24}
              color="white"
              style={styles.optionsItemIcon}
            />
            <Text style={styles.optionsItemText}>Set sleep timer</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.optionsItem}>
          <View style={styles.optionsItemContent}>
            <Text style={styles.optionsItemText}>Setting volume</Text>
          </View>
          <View style={styles.optionsVolumeBox}>
            <Feather
              name="volume"
              size={24}
              color="white"
              style={styles.optionsItemIcon}
            />
            <Slider
              style={styles.optionsVolumeSlider}
              minimumValue={0}
              maximumValue={1}
              onValueChange={handleAdjustVolume}
              minimumTrackTintColor="#007bff"
              maximumTrackTintColor={theme === "dark" ? "#fff" : "#000"}
              thumbTintColor={theme === "dark" ? "#fff" : "#000"}
            />

            <Feather
              name="volume-2"
              size={24}
              color="white"
              style={styles.optionsItemIcon}
            />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

export default memo(NowPlaying);

const styles = StyleSheet.create({
  LinearGradient: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 40,
  },
  blackColor: {
    color: "#000",
  },
  whiteColor: {
    color: "#fff",
  },
  pageStatusBar: {
    color: "#fff",
    flexDirection: "row",
    padding: 5,
    width: "100%",
    alignItems: "center",
    borderColor: "#000",
    borderBottomWidth: 2,
  },
  iconHeader: {
    position: "absolute",
    left: "5%",
    top: "5%",
    color: "#FFFFFF",
    zIndex: 99,
  },
  pageName: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  container: {
    paddingTop: 10,
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
  },
  playlistText: {
    opacity: 0.8,
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 10,
  },
  artistName: {
    fontSize: 18,
    fontWeight: "bold",
    opacity: 0.9,
  },
  cdImage: {
    width: 150,
    height: 150,
    borderRadius: 100,
    marginTop: 20,
  },
  slider: {
    width: "80%",
    height: 60,
    marginTop: 10,
    marginBottom: 10,
  },
  songName: {
    fontSize: 23,
    fontWeight: "bold",
  },
  lyricsBox: {
    width: "100%",
    flex: 1,
    //backgroundColor: 'pink',
  },
  lyricText: {
    textAlign: "center",
    fontSize: 18,
    marginTop: 5,
    marginBottom: 5,
  },
  musicControl: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    opacity: 0.8,
  },
  playIcon: {
    opacity: 1,
  },
  stepbackward: {
    marginRight: 30,
  },
  stepforward: {
    marginLeft: 30,
  },
  repeat: {
    marginLeft: 40,
  },
  random: {
    marginRight: 40,
  },
  options: {
    position: "absolute",
    right: -20,
    top: "-200%",
    fontSize: 20,
    padding: 40,
  },

  optionsMenu: {
    position: "absolute",
    top: "10%",
    right: -300,
    height: "100%",
    backgroundColor: "#000",
    width: 300,
    opacity: 1,
  },
  openMenu: {
    right: 0,
  },

  optionsItem: {
    padding: 20,
    flexDirection: "column",
    backgroundColor: "#121212",
    marginBottom: 20,
    marginTop: 20,
    position: "relative",
  },
  optionsItemText: {
    color: "#fff",
    fontSize: 20,
    marginLeft: 20,
  },
  optionsItemIcon: {},
  optionsItemContent: {
    flexDirection: "row",
  },
  optionsVolumeBox: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  optionsVolumeSlider: {
    flex: 1,
    marginRight: 10,
    height: 2,
  },
  radioButtons: {
    color: "red",
    backgroundColor: "#fff",
  },
});
