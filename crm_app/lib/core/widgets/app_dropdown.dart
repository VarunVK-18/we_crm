import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dropdown_button2/dropdown_button2.dart';

class AppDropdownFormField<T> extends StatefulWidget {
  final T? value;
  final List<DropdownMenuItem<T>>? items;
  final void Function(T?)? onChanged;
  final String? Function(T?)? validator;
  final InputDecoration? decoration;
  final Widget? hint;
  final TextStyle? style;

  const AppDropdownFormField({
    Key? key,
    this.value,
    this.items,
    this.onChanged,
    this.validator,
    this.decoration,
    this.hint,
    this.style,
  }) : super(key: key);

  @override
  State<AppDropdownFormField<T>> createState() => _AppDropdownFormFieldState<T>();
}

class _AppDropdownFormFieldState<T> extends State<AppDropdownFormField<T>> {
  late ValueNotifier<T?> _notifier;

  @override
  void initState() {
    super.initState();
    _notifier = ValueNotifier(widget.value);
  }

  @override
  void didUpdateWidget(AppDropdownFormField<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      _notifier.value = widget.value;
    }
  }

  @override
  void dispose() {
    _notifier.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final effectiveStyle = widget.style ??
        GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w400,
          color: Colors.black87,
        );

    final mappedItems = widget.items?.map((item) {
      final child = item.child;
      // Ensure text is left-aligned and shifted slightly left
      final styledChild = child is Text
          ? Transform.translate(
              offset: const Offset(-8, 0),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  child.data ?? '',
                  style: effectiveStyle,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.left,
                ),
              ),
            )
          : child;
      return DropdownItem<T>(
        value: item.value as T,
        child: styledChild,
      );
    }).toList();

    return DropdownButtonFormField2<T>(
      isExpanded: true,
      valueListenable: _notifier,
      items: mappedItems,
      onChanged: (val) {
        _notifier.value = val;
        if (widget.onChanged != null) {
          widget.onChanged!(val);
        }
      },
      validator: widget.validator,
      decoration: (widget.decoration ?? const InputDecoration()).copyWith(
        // Ensure content aligns left
        contentPadding: widget.decoration?.contentPadding ??
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      hint: widget.hint != null
          ? Transform.translate(
              offset: const Offset(-8, 0),
              child: widget.hint,
            )
          : null,
      style: effectiveStyle,
      // Force selected item to render left-aligned and shifted
      selectedItemBuilder: (context) {
        return (widget.items ?? []).map((item) {
          final child = item.child;
          return Transform.translate(
            offset: const Offset(-8, 0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: child is Text
                  ? Text(
                      child.data ?? '',
                      style: effectiveStyle,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.left,
                    )
                  : child,
            ),
          );
        }).toList();
      },
      dropdownStyleData: DropdownStyleData(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
          border: Border.all(color: Colors.grey.shade200),
        ),
      ),
      buttonStyleData: const FormFieldButtonStyleData(padding: EdgeInsets.zero),
      iconStyleData: const IconStyleData(
        icon: Icon(Icons.keyboard_arrow_down, color: Colors.grey, size: 20),
      ),
      menuItemStyleData: const MenuItemStyleData(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),
    );
  }
}
