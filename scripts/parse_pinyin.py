import json
import argparse

def strip_to_pinyin(value):
    # assume we have at least one definition for now...
    # use the first for now, but need to sort these on frequency, particularly for single characters
    first_definition = value[0]
    return ''.join([x[len(x)-1] for x in first_definition['pinyin'].split(' ')])


def get_pinyin(dict_filename):
    with open(dict_filename) as f:
        parsed_f = json.load(f)
        return {key: strip_to_pinyin(value) for key, value in parsed_f.items()}



def main():
    parser = argparse.ArgumentParser(
        description='Get pinyin in a compact format from the output of parse_cedict.py. Outputs JSON.')
    # TODO: use order_defs.py from hanzigraph to get most common tone by frequency
    parser.add_argument(
        '--dict-filename', help='the dictionary filename, output from parse_cedict.py')

    args = parser.parse_args()

    result = get_pinyin(args.dict_filename)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
