class BannerModel {
  final String id;
  final String title;
  final String imageUrl;
  final String targetUrl;
  final bool isActive;
  final String theme;
  final String subtitle;
  final String buttonText;

  BannerModel({
    required this.id,
    required this.title,
    required this.imageUrl,
    required this.targetUrl,
    required this.isActive,
    this.theme = 'light',
    this.subtitle = '',
    this.buttonText = 'Learn More',
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      imageUrl: json['imageUrl'] ?? '',
      targetUrl: json['targetUrl'] ?? '',
      isActive: json['isActive'] ?? false,
      theme: json['theme'] ?? 'light',
      subtitle: json['subtitle'] ?? '',
      buttonText: json['buttonText'] ?? 'Learn More',
    );
  }
}
