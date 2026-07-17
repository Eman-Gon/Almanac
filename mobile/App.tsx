import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview";

const STORAGE_KEY = "choicegrid-web-url";
const DEFAULT_URL =
  process.env.EXPO_PUBLIC_WEB_URL?.trim() || "http://127.0.0.1:3000";

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/$/, "");
  return `https://${trimmed}`.replace(/\/$/, "");
}

export default function App() {
  const webRef = useRef<WebView>(null);
  const [url, setUrl] = useState(DEFAULT_URL);
  const [draftUrl, setDraftUrl] = useState(DEFAULT_URL);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        const next = normalizeUrl(stored || DEFAULT_URL);
        setUrl(next);
        setDraftUrl(next);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const source = useMemo(() => ({ uri: `${url}/dashboard` }), [url]);

  const saveUrl = useCallback(async () => {
    const next = normalizeUrl(draftUrl);
    setDraftUrl(next);
    setUrl(next);
    setError(null);
    setLoading(true);
    setSettingsOpen(false);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, [draftUrl]);

  const onNav = useCallback((event: WebViewNavigation) => {
    setCanGoBack(event.canGoBack);
  }, []);

  if (!ready) {
    return (
      <SafeAreaView style={styles.boot}>
        <ActivityIndicator color="#4fc3e8" size="large" />
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back in Almanac"
          disabled={!canGoBack}
          onPress={() => webRef.current?.goBack()}
          style={[styles.toolButton, !canGoBack && styles.toolButtonDisabled]}
        >
          <Text style={styles.toolLabel}>Back</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reload Almanac"
          onPress={() => {
            setError(null);
            setLoading(true);
            webRef.current?.reload();
          }}
          style={styles.toolButton}
        >
          <Text style={styles.toolLabel}>Reload</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open server settings"
          onLongPress={() => setSettingsOpen(true)}
          onPress={() => setSettingsOpen(true)}
          style={styles.toolButton}
        >
          <Text style={styles.toolLabel}>Server</Text>
        </Pressable>
      </View>

      <View style={styles.webWrap}>
        {loading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color="#0d6e8c" size="large" />
            <Text style={styles.loadingText}>Loading Almanac…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Could not load Almanac</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Text style={styles.errorHint}>
              Use a deployed Vercel URL, or your computer's LAN IP with the Next.js
              dev server (phones cannot reach localhost).
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSettingsOpen(true)}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonLabel}>Change server URL</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => Linking.openURL(`${url}/dashboard`)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonLabel}>Open in browser</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            ref={webRef}
            source={source}
            onNavigationStateChange={onNav}
            onLoadStart={() => {
              setLoading(true);
              setError(null);
            }}
            onLoadEnd={() => setLoading(false)}
            onError={(event) => {
              setLoading(false);
              setError(event.nativeEvent.description || "WebView failed to load.");
            }}
            onHttpError={(event) => {
              if (event.nativeEvent.statusCode >= 400) {
                setLoading(false);
                setError(`HTTP ${event.nativeEvent.statusCode} from ${url}`);
              }
            }}
            allowsBackForwardNavigationGestures
            setSupportMultipleWindows={false}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            javaScriptEnabled
            domStorageEnabled
            style={styles.webview}
          />
        )}
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={settingsOpen}
        onRequestClose={() => setSettingsOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Almanac server</Text>
            <Text style={styles.modalBody}>
              This Expo Go app is a native shell over the hosted web demo. Demo
              state stays inside the WebView localStorage.
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="https://your-app.vercel.app"
              placeholderTextColor="#93a9b1"
              style={styles.input}
              value={draftUrl}
              onChangeText={setDraftUrl}
            />
            <Pressable
              accessibilityRole="button"
              onPress={saveUrl}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonLabel}>Save and load</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setDraftUrl(url);
                setSettingsOpen(false);
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonLabel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0c2830",
  },
  root: {
    flex: 1,
    backgroundColor: "#0c2830",
  },
  toolbar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#0c2830",
  },
  toolButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#124049",
  },
  toolButtonDisabled: {
    opacity: 0.4,
  },
  toolLabel: {
    color: "#edf4f4",
    fontSize: 13,
    fontWeight: "600",
  },
  webWrap: {
    flex: 1,
    backgroundColor: "#edf4f4",
  },
  webview: {
    flex: 1,
    backgroundColor: "#edf4f4",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "rgba(237, 244, 244, 0.92)",
  },
  loadingText: {
    color: "#2c4a55",
    fontSize: 14,
    fontWeight: "600",
  },
  errorPanel: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: "#edf4f4",
  },
  errorTitle: {
    color: "#0d2129",
    fontSize: 20,
    fontWeight: "700",
  },
  errorBody: {
    color: "#cc3a2c",
    fontSize: 14,
  },
  errorHint: {
    color: "#4c666f",
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 4,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#0d6e8c",
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c4d5d9",
    backgroundColor: "#ffffff",
  },
  secondaryButtonLabel: {
    color: "#0a5670",
    fontSize: 15,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(6, 23, 29, 0.55)",
  },
  modalCard: {
    gap: 12,
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#ffffff",
  },
  modalTitle: {
    color: "#0d2129",
    fontSize: 18,
    fontWeight: "700",
  },
  modalBody: {
    color: "#4c666f",
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#c4d5d9",
    borderRadius: 10,
    color: "#0d2129",
    backgroundColor: "#f6fbfb",
    fontSize: 15,
  },
});
