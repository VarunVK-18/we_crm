import 'dart:convert';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/chat_provider.dart';
import '../../providers/orders_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/services.dart';

class OrderChatScreen extends ConsumerStatefulWidget {
  final String orderId;
  final String serviceName;
  final String assignedExpert;

  const OrderChatScreen({
    super.key,
    required this.orderId,
    required this.serviceName,
    required this.assignedExpert,
  });

  @override
  ConsumerState<OrderChatScreen> createState() => _OrderChatScreenState();
}

class _OrderChatScreenState extends ConsumerState<OrderChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String _selectedSenderRole = 'client';
  
  Color _chatBackgroundColor = Colors.white;
  final List<Map<String, dynamic>> _bgColors = [
    {'name': 'Light', 'color': Colors.white},
    {'name': 'Off White', 'color': const Color(0xFFF5F5F5)},
    {'name': 'Mint', 'color': const Color(0xFFE8F5E9)},
    {'name': 'Blue Tint', 'color': const Color(0xFFE3F2FD)},
    {'name': 'Warm Sand', 'color': const Color(0xFFFFF3E0)},
    {'name': 'Soft Rose', 'color': const Color(0xFFFCE4EC)},
  ];
  
  bool _isSearching = false;
  String _searchQuery = '';
  int _currentMatchIndex = 0;
  final List<int> _matchedMessageIndices = [];
  final Map<int, GlobalKey> _itemKeys = {};
  
  // Smart Mentions State
  bool _showMentionDropdown = false;
  String _mentionSearch = '';
  List<Map<String, dynamic>> _mentionOptions = [];
  List<Map<String, dynamic>> _allMentionOptions = [];

  @override
  void initState() {
    super.initState();
    _loadChatBackground();
    _messageController.addListener(_onMessageChanged);
  }

  @override
  void dispose() {
    _messageController.removeListener(_onMessageChanged);
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _loadMentionOptions() {
    final orders = ref.read(serviceOrdersProvider).value ?? [];
    final order = orders.where((o) => o.id == widget.orderId).firstOrNull;
    if (order == null) return;
    
    final opts = <Map<String, dynamic>>[];
    
    final createdBy = order.details['created_by'];
    if (createdBy is Map && createdBy['owner_name'] != null) {
      opts.add({'name': createdBy['owner_name'], 'role': 'Client Manager', 'internalRole': 'client_manager'});
    }
    final assignedTo = order.details['assigned_to'];
    if (assignedTo is Map && assignedTo['owner_name'] != null) {
      opts.add({'name': assignedTo['owner_name'], 'role': 'Filing Staff', 'internalRole': 'filling_staff'});
    }
    final clientId = order.details['client_id'];
    if (clientId is Map && clientId['owner_name'] != null) {
      opts.add({'name': clientId['owner_name'], 'role': 'Client', 'internalRole': 'customer'});
    }
    
    _allMentionOptions = opts;
  }

  void _onMessageChanged() {
    final text = _messageController.text;
    final cursor = _messageController.selection.baseOffset;
    if (cursor < 0 || cursor > text.length) return;
    
    final textBeforeCursor = text.substring(0, cursor);
    final lastAtIdx = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIdx != -1) {
      final search = textBeforeCursor.substring(lastAtIdx + 1);
      if (!search.contains(' ')) {
        _loadMentionOptions();
        final filtered = _allMentionOptions.where((opt) => 
          opt['name'].toString().toLowerCase().contains(search.toLowerCase()) || 
          opt['role'].toString().toLowerCase().contains(search.toLowerCase())
        ).toList();
        
        setState(() {
          _showMentionDropdown = true;
          _mentionSearch = search;
          _mentionOptions = filtered;
        });
        return;
      }
    }
    
    if (_showMentionDropdown) {
      setState(() {
        _showMentionDropdown = false;
      });
    }
  }

  void _insertMention(Map<String, dynamic> opt) {
    final text = _messageController.text;
    final cursor = _messageController.selection.baseOffset;
    if (cursor < 0) return;
    
    final textBeforeCursor = text.substring(0, cursor);
    final lastAtIdx = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIdx != -1) {
      final before = text.substring(0, lastAtIdx);
      final after = text.substring(cursor);
      final mentionStr = '@${opt['name']} ';
      
      _messageController.value = TextEditingValue(
        text: before + mentionStr + after,
        selection: TextSelection.collapsed(offset: before.length + mentionStr.length),
      );
    }
    
    setState(() {
      _showMentionDropdown = false;
    });
  }

  Future<void> _loadChatBackground() async {
    final prefs = await SharedPreferences.getInstance();
    final colorVal = prefs.getInt('chat_bg_color');
    if (colorVal != null) {
      setState(() {
        _chatBackgroundColor = Color(colorVal);
      });
    }
  }

  Future<void> _changeChatBackground(Color color) async {
    setState(() {
      _chatBackgroundColor = color;
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('chat_bg_color', color.value);
    if (mounted) {
      Navigator.pop(context);
    }
  }

  void _showThemePicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Chat Background',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.deepTeal,
                ),
              ),
              const SizedBox(height: 20),
              Wrap(
                spacing: 16,
                runSpacing: 16,
                children: _bgColors.map((bg) {
                  final isSelected = _chatBackgroundColor.value == bg['color'].value;
                  return GestureDetector(
                    onTap: () => _changeChatBackground(bg['color']),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: bg['color'],
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isSelected ? AppTheme.deepTeal : Colors.grey.shade300,
                              width: isSelected ? 3 : 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              )
                            ],
                          ),
                          child: isSelected 
                            ? const Icon(LucideIcons.check, color: AppTheme.deepTeal)
                            : null,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          bg['name'],
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? AppTheme.deepTeal : Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  void _scrollToMatch(int index) {
    final key = _itemKeys[index];
    if (key != null && key.currentContext != null) {
      Scrollable.ensureVisible(
        key.currentContext!,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        alignment: 0.5,
      );
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    final lowerText = text.toLowerCase();
    List<String> mentions = [];
    if (_allMentionOptions.isEmpty) {
      _loadMentionOptions(); // Ensure options are loaded
    }
    for (final opt in _allMentionOptions) {
      if (lowerText.contains('@${opt['name'].toString().toLowerCase()}')) {
        final role = opt['internalRole'].toString();
        if (!mentions.contains(role)) {
          mentions.add(role);
        }
      }
    }
    if (lowerText.contains('@admin')) mentions.add('admin');

    _messageController.clear();
    
    final success = await ref
        .read(chatProvider(widget.orderId).notifier)
        .sendMessage(text, senderRole: _selectedSenderRole, mentions: mentions);
        
    if (success) {
      Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
    }
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider(widget.orderId));
    
    // Determine directors for role selection
    final orders = ref.watch(serviceOrdersProvider).value ?? [];
    final order = orders.where((o) => o.id == widget.orderId).firstOrNull;
    
    List<dynamic> directors = [];
    if (order != null) {
      try {
        if (order.details['directors'] is String) {
          directors = jsonDecode(order.details['directors']);
        } else {
          directors = order.details['directors'] ?? [];
        }
      } catch (_) {
        directors = [];
      }
    }

    final roleOptions = [
      {'value': 'client', 'label': 'Chat as Client'},
      for (int i = 0; i < directors.length; i++) ...() {
        final dir = directors[i] is Map ? directors[i] as Map : {};
        final name = dir['directorName']?.toString() ?? dir['name']?.toString() ?? dir['fullName']?.toString() ?? '';
        final displayName = name.isNotEmpty ? '$name (Dir ${i + 1})' : 'Director ${i + 1}';
        return [{'value': 'director_${i + 1}', 'label': 'Chat as $displayName'}];
      }(),
    ];

    _matchedMessageIndices.clear();
    if (_searchQuery.isNotEmpty) {
      final queryRegex = RegExp(RegExp.escape(_searchQuery), caseSensitive: false);
      for (int i = 0; i < chatState.messages.length; i++) {
        if (queryRegex.hasMatch(chatState.messages[i].content)) {
          _matchedMessageIndices.add(i);
        }
      }
    }
    if (_currentMatchIndex >= _matchedMessageIndices.length) {
      _currentMatchIndex = _matchedMessageIndices.isNotEmpty ? _matchedMessageIndices.length - 1 : 0;
    }

    ref.listen(chatProvider(widget.orderId), (previous, next) {
      if (previous == null || next.messages.length > previous.messages.length) {
        // Use a longer delay to ensure the ListView is fully built before scrolling
        Future.delayed(const Duration(milliseconds: 300), _scrollToBottom);
      }
    });

    return Stack(
      children: [
        Positioned.fill(
          child: Container(
            color: Colors.white,
            child: Opacity(
              opacity: 0.10,
              child: Image.asset(
                'assets/Chatbackground.png',
                repeat: ImageRepeat.repeat,
              ),
            ),
          ),
        ),
        Scaffold(
          backgroundColor: Colors.transparent,
          appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppTheme.deepTeal),
          onPressed: () => Navigator.pop(context),
        ),
        title: _isSearching
            ? Container(
                height: 38,
                margin: const EdgeInsets.only(right: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.black87),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextField(
                        autofocus: true,
                        style: const TextStyle(color: Colors.black87, fontSize: 14),
                        decoration: const InputDecoration(
                          hintText: 'Search messages...',
                          hintStyle: TextStyle(color: Colors.grey, fontSize: 14),
                          border: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          errorBorder: InputBorder.none,
                          disabledBorder: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.only(bottom: 2), // small adjustment
                        ),
                        onChanged: (val) {
                          setState(() {
                            _searchQuery = val.toLowerCase();
                          });
                        },
                      ),
                    ),
                    if (_searchQuery.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: Text(
                          _matchedMessageIndices.isEmpty ? '0 of 0' : '${_currentMatchIndex + 1} of ${_matchedMessageIndices.length}',
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    const SizedBox(width: 16),
                  ],
                ),
              )
            : Row(
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: AppTheme.deepTeal.withOpacity(0.1),
              child: const Icon(LucideIcons.user, color: AppTheme.deepTeal, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Client Support',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.deepTeal,
                    ),
                  ),
                  Text(
                    widget.serviceName,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade500,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          if (_isSearching) ...[
            IconButton(
              icon: Icon(LucideIcons.chevronLeft, color: _matchedMessageIndices.isNotEmpty && _currentMatchIndex > 0 ? Colors.grey.shade600 : Colors.grey.shade300),
              onPressed: () {
                setState(() {
                  if (_currentMatchIndex > 0) {
                    _currentMatchIndex--;
                    _scrollToMatch(_matchedMessageIndices[_currentMatchIndex]);
                  }
                });
              },
            ),
            IconButton(
              icon: Icon(LucideIcons.chevronRight, color: _matchedMessageIndices.isNotEmpty && _currentMatchIndex < _matchedMessageIndices.length - 1 ? Colors.grey.shade600 : Colors.grey.shade300),
              onPressed: () {
                setState(() {
                  if (_currentMatchIndex < _matchedMessageIndices.length - 1) {
                    _currentMatchIndex++;
                    _scrollToMatch(_matchedMessageIndices[_currentMatchIndex]);
                  }
                });
              },
            ),
            IconButton(
              icon: const Icon(LucideIcons.x, color: Colors.grey),
              onPressed: () {
                setState(() {
                  _isSearching = false;
                  _searchQuery = '';
                  _currentMatchIndex = 0;
                  _matchedMessageIndices.clear();
                });
              },
            ),
          ],
          if (!_isSearching) ...[
            IconButton(
              icon: const Icon(LucideIcons.search, color: AppTheme.deepTeal),
              onPressed: () {
                setState(() {
                  _isSearching = true;
                });
              },
            ),
          ],
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: Colors.grey.shade200,
            height: 1,
          ),
        ),
      ),
      body: Container(
        child: Column(
          children: [
            Expanded(
            child: chatState.isLoading && chatState.messages.isEmpty
                ? const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.deepTeal),
                    ),
                  )
                : chatState.error != null && chatState.messages.isEmpty
                    ? Center(child: Text(chatState.error!))
                    : SingleChildScrollView(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 20),
                        child: Column(
                          children: [
                            for (int index = 0; index < chatState.messages.length; index++) ...() {
                              final message = chatState.messages[index];
                              final isMe = message.senderRole == 'client' || message.senderRole.startsWith('director_');
                              
                              bool showDateDivider = false;
                              if (index == 0) {
                                showDateDivider = true;
                              } else {
                                final prevMsg = chatState.messages[index - 1];
                                final currDate = DateTime(message.timestamp.year, message.timestamp.month, message.timestamp.day);
                                final prevDate = DateTime(prevMsg.timestamp.year, prevMsg.timestamp.month, prevMsg.timestamp.day);
                                if (currDate != prevDate) showDateDivider = true;
                              }

                              if (!_itemKeys.containsKey(index)) {
                                _itemKeys[index] = GlobalKey();
                              }

                              Widget bubble = Container(
                                key: _itemKeys[index],
                                child: _buildMessageBubble(
                                  content: message.content,
                                  isMe: isMe,
                                  timestamp: message.timestamp,
                                  seen: message.seen,
                                  senderName: message.senderName,
                                  senderRole: message.senderRole,
                                  directors: directors,
                                  searchQuery: _searchQuery,
                                ),
                              );

                              return [
                                if (showDateDivider) _buildDateDivider(message.timestamp),
                                bubble,
                              ];
                            }(),
                          ],
                        ),
                      ),
          ),
          
            // Mention Dropdown Overlay
            if (_showMentionDropdown)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: const BorderRadius.only(topLeft: Radius.circular(12), topRight: Radius.circular(12)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -5),
                    )
                  ],
                ),
                constraints: const BoxConstraints(maxHeight: 180),
                child: _mentionOptions.isEmpty 
                  ? const Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Center(child: Text('No matches found', style: TextStyle(color: Colors.grey, fontSize: 13))),
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      itemCount: _mentionOptions.length,
                      itemBuilder: (context, index) {
                        final opt = _mentionOptions[index];
                        return InkWell(
                          onTap: () => _insertMention(opt),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(opt['name'], style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                const SizedBox(height: 2),
                                Text(opt['role'], style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
              ),

            // Chat Input Area
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                // Removed shadow as requested
              ),
              child: SafeArea(
                child: Column(
                  children: [
                    if (roleOptions.length > 1)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10.0),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.corporateBlue.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppTheme.corporateBlue.withOpacity(0.1)),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _selectedSenderRole,
                                isDense: true,
                                icon: Padding(
                                  padding: const EdgeInsets.only(left: 6.0),
                                  child: Icon(LucideIcons.chevronDown, size: 14, color: AppTheme.corporateBlue.withOpacity(0.7)),
                                ),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.corporateBlue,
                                ),
                                borderRadius: BorderRadius.circular(16),
                                dropdownColor: Colors.white,
                                elevation: 4,
                                onChanged: (String? newValue) {
                                  if (newValue != null) {
                                    setState(() {
                                      _selectedSenderRole = newValue;
                                    });
                                  }
                                },
                                items: roleOptions.map<DropdownMenuItem<String>>((option) {
                                  return DropdownMenuItem<String>(
                                    value: option['value']!,
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          option['value'] == 'client' ? LucideIcons.user : LucideIcons.briefcase,
                                          size: 12,
                                          color: AppTheme.corporateBlue,
                                        ),
                                        const SizedBox(width: 6),
                                        Text(option['label']!),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                          ),
                        ),
                      ),
                    Row(
                      children: [
                        Expanded(
                      child: TextField(
                        controller: _messageController,
                        decoration: InputDecoration(
                          hintText: 'Type a message...',
                          hintStyle: TextStyle(color: Colors.grey.shade500),
                          filled: true,
                          fillColor: Colors.grey.shade100,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide(color: AppTheme.deepTeal.withOpacity(0.5), width: 1.5),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 14,
                          ),
                        ),
                        textCapitalization: TextCapitalization.sentences,
                        inputFormatters: [
                          MentionDeletionFormatter(_allMentionOptions.map((e) => e['name'].toString()).toList()),
                        ],
                        minLines: 1,
                        maxLines: 4,
                      ),
                    ),
                  const SizedBox(width: 12),
                  ValueListenableBuilder<TextEditingValue>(
                    valueListenable: _messageController,
                    builder: (context, value, child) {
                      final isComposing = value.text.trim().isNotEmpty;
                      return GestureDetector(
                        onTap: isComposing ? _sendMessage : null,
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: isComposing ? AppTheme.deepTeal : Colors.grey.shade400,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            LucideIcons.send,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
          ],
        ),
      ),
        ),
      ],
    );
  }

  List<TextSpan> _buildHighlightedText(String text, String query) {
    if (query.isEmpty) return [TextSpan(text: text)];
    final lowerText = text.toLowerCase();
    final lowerQuery = query.toLowerCase();
    List<TextSpan> spans = [];
    int start = 0;
    int idx;
    while ((idx = lowerText.indexOf(lowerQuery, start)) != -1) {
      if (idx > start) {
        spans.add(TextSpan(text: text.substring(start, idx)));
      }
      spans.add(TextSpan(
        text: text.substring(idx, idx + query.length),
        style: const TextStyle(backgroundColor: Colors.amber, color: Colors.black, fontWeight: FontWeight.bold),
      ));
      start = idx + query.length;
    }
    if (start < text.length) {
      spans.add(TextSpan(text: text.substring(start)));
    }
    return spans;
  }

  Widget _buildDateDivider(DateTime timestamp) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final msgDate = DateTime(timestamp.year, timestamp.month, timestamp.day);
    
    String dateText;
    if (msgDate == today) {
      dateText = 'Today';
    } else if (msgDate == yesterday) {
      dateText = 'Yesterday';
    } else {
      dateText = DateFormat('MMM dd, yyyy').format(timestamp);
    }
    
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.corporateBlue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        dateText,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppTheme.corporateBlue,
        ),
      ),
    );
  }

  Widget _buildMessageBubble({
    required String content,
    required bool isMe,
    required DateTime timestamp,
    required bool seen,
    required String senderName,
    required String senderRole,
    required List<dynamic> directors,
    String searchQuery = '',
  }) {
    final timeStr = DateFormat('hh:mm a').format(timestamp);
    
    String badgeText = '';
    if (senderRole == 'admin') {
      badgeText = 'Manager';
    } else if (senderRole == 'client_manager') badgeText = 'Client Manager';
    else if (senderRole == 'filing_staff') badgeText = 'Filing Staff';
    else if (senderRole == 'staff') badgeText = 'Client Support';
    else if (senderRole.startsWith('director_')) {
      final parts = senderRole.split('_');
      if (parts.length > 1) {
        final idx = int.tryParse(parts[1]) ?? 0;
        if (idx > 0 && idx <= directors.length) {
          final dir = directors[idx - 1] is Map ? directors[idx - 1] as Map : {};
          final dName = dir['directorName']?.toString() ?? dir['name']?.toString() ?? dir['fullName']?.toString() ?? '';
          badgeText = dName.isNotEmpty ? 'Dir $idx: $dName' : 'Director $idx';
        } else {
          badgeText = 'Director ${parts[1]}';
        }
      }
    } else {
      badgeText = senderRole.split('_').map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}' : '').join(' ');
    }
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            CircleAvatar(
              radius: 12,
              backgroundColor: AppTheme.deepTeal.withOpacity(0.1),
              child: const Icon(LucideIcons.user, color: AppTheme.deepTeal, size: 12),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isMe || senderRole.startsWith('director_')) ...[
                  Padding(
                    padding: EdgeInsets.only(
                      left: isMe ? 0 : 4,
                      right: isMe ? 4 : 0,
                      bottom: 4,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
                      children: [
                        if (!isMe)
                          Text(
                            senderName,
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        if (!isMe && badgeText.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Text(
                            '•',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.grey.shade400,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            badgeText,
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              fontWeight: FontWeight.w400,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: isMe ? const Color(0xFF111827) : const Color(0xFF232427),
                    borderRadius: BorderRadius.circular(16).copyWith(
                      bottomRight: isMe ? const Radius.circular(2) : const Radius.circular(16),
                      topLeft: !isMe ? const Radius.circular(2) : const Radius.circular(16),
                    ),
                  ),
              child: RichText(
                text: TextSpan(
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14.5,
                    height: 1.3,
                    decoration: TextDecoration.none,
                  ),
                  children: [
                    ..._buildHighlightedText(content, searchQuery),
                    const WidgetSpan(child: SizedBox(width: 12)),
                    WidgetSpan(
                      alignment: PlaceholderAlignment.bottom,
                      child: Padding(
                        padding: const EdgeInsets.only(top: 4, bottom: 0),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              timeStr,
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.5),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (isMe) ...[
                              const SizedBox(width: 4),
                              seen
                                  ? const HugeIcon(
                                      icon: HugeIcons.strokeRoundedTickDouble02,
                                      size: 16,
                                      color: Colors.green,
                                    )
                                  : HugeIcon(
                                      icon: HugeIcons.strokeRoundedTick02,
                                      size: 16,
                                      color: Colors.white.withOpacity(0.7),
                                    ),
                              const SizedBox(width: 4),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
        ],
      ),
    );
  }
}

class MentionDeletionFormatter extends TextInputFormatter {
  final List<String> currentMentionNames;

  MentionDeletionFormatter(this.currentMentionNames);

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.length < oldValue.text.length) {
      final oldText = oldValue.text;
      
      final cursorOld = oldValue.selection.baseOffset;
      final cursorNew = newValue.selection.baseOffset;
      
      if (cursorOld > 0 && cursorOld > cursorNew) {
        for (final name in currentMentionNames) {
          final mentionStr = '@$name ';
          final mentionStrNoSpace = '@$name';
          
          if (cursorOld >= mentionStr.length) {
            final possibleMention = oldText.substring(cursorOld - mentionStr.length, cursorOld);
            if (possibleMention == mentionStr) {
              final newTextUpdated = oldText.replaceRange(cursorOld - mentionStr.length, cursorOld, '');
              return TextEditingValue(
                text: newTextUpdated,
                selection: TextSelection.collapsed(offset: cursorOld - mentionStr.length),
              );
            }
          }
          
          if (cursorOld >= mentionStrNoSpace.length) {
            final possibleMention = oldText.substring(cursorOld - mentionStrNoSpace.length, cursorOld);
            if (possibleMention == mentionStrNoSpace) {
              final newTextUpdated = oldText.replaceRange(cursorOld - mentionStrNoSpace.length, cursorOld, '');
              return TextEditingValue(
                text: newTextUpdated,
                selection: TextSelection.collapsed(offset: cursorOld - mentionStrNoSpace.length),
              );
            }
          }
        }
      }
    }
    return newValue;
  }
}
