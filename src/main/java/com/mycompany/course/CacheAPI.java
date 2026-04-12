package com.mycompany.course;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;


public class CacheAPI {

    //  Field identifiers used as keys for the input history
    public static final String FIELD_COURSE_CODE = "courseCode";
    public static final String FIELD_COURSE_NAME = "courseName";
    public static final String FIELD_STUDENT_ID  = "studentId";
    public static final String FIELD_STUDENT_NAME = "studentName";

    // Search result type identifiers
    public static final String TYPE_COURSE  = "course";
    public static final String TYPE_STUDENT = "student";

    // Maximum number of entries kept in each cache history
    private static final int MAX_CACHE_SIZE   = 10;
    private static final int MAX_HISTORY_SIZE = 20;


    private final Map<String, String> searchCache = new LruMap<>(MAX_CACHE_SIZE);


    private final Map<String, List<String>> inputHistory = new LinkedHashMap<>();

    // Constructor

    public CacheAPI() {
        inputHistory.put(FIELD_COURSE_CODE,  new ArrayList<>());
        inputHistory.put(FIELD_COURSE_NAME,  new ArrayList<>());
        inputHistory.put(FIELD_STUDENT_ID,   new ArrayList<>());
        inputHistory.put(FIELD_STUDENT_NAME, new ArrayList<>());
    }

    // Search result cache

    public void cacheSearchResult(String type, String key, String label) {
        if (type == null || key == null || key.isBlank()) return;
        searchCache.put(buildCacheKey(type, key), label != null ? label : key);
    }

    public String getCachedResult(String type, String key) {
        if (type == null || key == null) return null;
        return searchCache.get(buildCacheKey(type, key));
    }

    public void evict(String type, String key) {
        if (type == null || key == null) return;
        searchCache.remove(buildCacheKey(type, key));
    }


    public void clearSearchCache() {
        searchCache.clear();
    }

    // Input history

    public void recordInput(String field, String value) {
        if (field == null || value == null || value.isBlank()) return;
        List<String> history = inputHistory.get(field);
        if (history == null) return;

        history.remove(value);          // remove duplicate if present
        history.add(0, value);          // insert at front (newest first)


        while (history.size() > MAX_HISTORY_SIZE) {
            history.remove(history.size() - 1);
        }
    }

    public List<String> getSuggestions(String field, String prefix, int limit) {
        List<String> result = new ArrayList<>();
        List<String> history = inputHistory.get(field);
        if (history == null) return result;

        String lowerPrefix = (prefix == null) ? "" : prefix.trim().toLowerCase();

        for (String entry : history) {
            if (entry.toLowerCase().startsWith(lowerPrefix)) {
                result.add(entry);
                if (result.size() >= limit) break;
            }
        }
        return result;
    }

    // suggests up to 5 suggestions.
    public List<String> getSuggestions(String field, String prefix) {
        return getSuggestions(field, prefix, 5);
    }

    public void clearHistory(String field) {
        List<String> history = inputHistory.get(field);
        if (history != null) history.clear();
    }


    public void clearAllHistory() {
        for (List<String> list : inputHistory.values()) list.clear();
    }

    // Console helper

    public void printSuggestions(String field, String prefix) {
        List<String> suggestions = getSuggestions(field, prefix);
        if (suggestions.isEmpty()) return;

        System.out.println("  [Suggestions: " + String.join(" | ", suggestions) + "]");
    }

    // summary

    public void printCacheStatus() {
        System.out.println("\n--- CacheAPI Status ---");
        System.out.println("Search cache entries : " + searchCache.size() + "/" + MAX_CACHE_SIZE);
        for (Map.Entry<String, String> e : searchCache.entrySet()) {
            System.out.println("  " + e.getKey() + " → " + e.getValue());
        }
        System.out.println("Input history:");
        for (Map.Entry<String, List<String>> e : inputHistory.entrySet()) {
            System.out.println("  " + e.getKey() + " (" + e.getValue().size() + "): " + e.getValue());
        }
    }

    // Internal helpers

    private String buildCacheKey(String type, String key) {
        return type + ":" + key.trim().toLowerCase();
    }

    /**
     * Fixed-capacity LinkedHashMap that evicts the oldest entry
     * when the maximum size is exceeded (Least-Recently-Used policy).
     */
    private static class LruMap<K, V> extends LinkedHashMap<K, V> {
        private final int maxSize;

        LruMap(int maxSize) {
            super(maxSize + 1, 0.75f, true); // access-order = true → LRU
            this.maxSize = maxSize;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > maxSize;
        }
    }
}